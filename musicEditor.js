class MusicScoreEditor {
    constructor() {
        this.canvas = document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.tracks = [[]]; // Initialize with empty first track
        this.currentTrack = 0;
        this.tempo = 120;
        this.isPlaying = false;
        this.playbackLine = null;
        this.playbackStartPosition = -5; // Startposition links
        this.playbackEndPosition = 5;    // Endposition rechts

        // Transport initialisieren
        Tone.Transport.bpm.value = this.tempo;
        Tone.Transport.timeSignature = 4;

        this.setupScene();
        this.setupSynth();
        this.setupEventListeners();
    }

    setupScene() {
        // Kamera um 90 Grad drehen und von oben schauen
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI / 2, // alpha (seitliche Rotation)
            Math.PI / 2,           // beta (vertikale Rotation - direkt von oben)
            10,          // radius
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);

        // Beleuchtung
        new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);

        // Notenlinien erstellen
        this.createStaffLines();

        // Playback-Linie erstellen
        this.createPlaybackLine();
    }

    setupSynth() {
        this.synth = new Tone.Synth().toDestination();

        // Sampler mit allen Noten von A bis G, using # for sharps
        this.sampler = new Tone.Sampler({
            urls: {
                // Oktave 0
                "A0": "A0.mp3",
                "A#0": "As0.mp3",
                "B0": "B0.mp3",
                "C0": "C0.mp3",
                "C#0": "Cs0.mp3",
                "D0": "D0.mp3",
                "D#0": "Ds0.mp3",
                "E0": "E0.mp3",
                "F0": "F0.mp3",
                "F#0": "Fs0.mp3",
                "G0": "G0.mp3",
                "G#0": "Gs0.mp3",

                // Oktave 1
                "A1": "A1.mp3",
                "A#1": "As1.mp3",
                "B1": "B1.mp3",
                "C1": "C1.mp3",
                "C#1": "Cs1.mp3",
                "D1": "D1.mp3",
                "D#1": "Ds1.mp3",
                "E1": "E1.mp3",
                "F1": "F1.mp3",
                "F#1": "Fs1.mp3",
                "G1": "G1.mp3",
                "G#1": "Gs1.mp3",

                // Oktave 2
                "A2": "A2.mp3",
                "A#2": "As2.mp3",
                "B2": "B2.mp3",
                "C2": "C2.mp3",
                "C#2": "Cs2.mp3",
                "D2": "D2.mp3",
                "D#2": "Ds2.mp3",
                "E2": "E2.mp3",
                "F2": "F2.mp3",
                "F#2": "Fs2.mp3",
                "G2": "G2.mp3",
                "G#2": "Gs2.mp3",

                // Oktave 3
                "A3": "A3.mp3",
                "A#3": "As3.mp3",
                "B3": "B3.mp3",
                "C3": "C3.mp3",
                "C#3": "Cs3.mp3",
                "D3": "D3.mp3",
                "D#3": "Ds3.mp3",
                "E3": "E3.mp3",
                "F3": "F3.mp3",
                "F#3": "Fs3.mp3",
                "G3": "G3.mp3",
                "G#3": "Gs3.mp3",

                // Oktave 4
                "A4": "A4.mp3",
                "A#4": "As4.mp3",
                "B4": "B4.mp3",
                "C4": "C4.mp3",
                "C#4": "Cs4.mp3",
                "D4": "D4.mp3",
                "D#4": "Ds4.mp3",
                "E4": "E4.mp3",
                "F4": "F4.mp3",
                "F#4": "Fs4.mp3",
                "G4": "G4.mp3",
                "G#4": "Gs4.mp3",

                // Oktave 5
                "A5": "A5.mp3",
                "A#5": "As5.mp3",
                "B5": "B5.mp3",
                "C5": "C5.mp3",
                "C#5": "Cs5.mp3",
                "D5": "D5.mp3",
                "D#5": "Ds5.mp3",
                "E5": "E5.mp3",
                "F5": "F5.mp3",
                "F#5": "Fs5.mp3",
                "G5": "G5.mp3",
                "G#5": "Gs5.mp3",

                // Oktave 6
                "A6": "A6.mp3",
                "A#6": "As6.mp3",
                "B6": "B6.mp3",
                "C6": "C6.mp3",
                "C#6": "Cs6.mp3",
                "D6": "D6.mp3",
                "D#6": "Ds6.mp3",
                "E6": "E6.mp3",
                "F6": "F6.mp3",
                "F#6": "Fs6.mp3",
                "G6": "G6.mp3",
                "G#6": "Gs6.mp3"
            },
            baseUrl: "assets/",
            onload: () => {
                console.log("Samples loaded successfully");
            },
            onerror: (error) => {
                console.error("Error loading samples:", error);
            }
        }).toDestination();
    }

    createStaffLines() {
        const lineCount = 5;
        const lineSpacing = 0.2;
        const lineLength = 10;

        for (let i = 0; i < lineCount; i++) {
            const line = BABYLON.MeshBuilder.CreateLines("staffLine", {
                points: [
                    new BABYLON.Vector3(-lineLength / 2, i * lineSpacing, 0),
                    new BABYLON.Vector3(lineLength / 2, i * lineSpacing, 0)
                ]
            });
            line.color = new BABYLON.Color3(0, 0, 0);
        }
    }

    createNote(position) {
        // Note als 3D-Objekt erstellen
        const noteHead = BABYLON.MeshBuilder.CreateSphere("noteHead", {
            diameter: 0.15
        }, this.scene);

        noteHead.position = position;

        // Konvertiere y-Position zu Tonhöhe
        // Wir haben 5 Linien mit Abstand 0.2, beginnend bei y=0
        // Berechne die entsprechende Note basierend auf der y-Position
        const notePositions = {
            0: "F4",    // Erste Linie
            0.2: "A4",  // Zweite Linie
            0.4: "C5",  // Dritte Linie
            0.6: "E5",  // Vierte Linie
            0.8: "G5"   // Fünfte Linie
        };

        // Finde die nächstgelegene Position
        let closestPosition = 0;
        let minDistance = Number.MAX_VALUE;

        for (let pos in notePositions) {
            const distance = Math.abs(position.y - pos);
            if (distance < minDistance) {
                minDistance = distance;
                closestPosition = pos;
            }
        }

        const pitch = notePositions[closestPosition];
        const duration = "4n"; // Viertelnote als Standard

        // Note zum aktuellen Track hinzufügen
        const note = {
            mesh: noteHead,
            pitch: pitch,
            duration: duration,
            position: position,
            time: position.x + 5 // Konvertiere Position zu Zeit (offset von 5 wegen playbackStartPosition)
        };

        this.tracks[this.currentTrack].push(note);

        // Sortiere Noten nach Zeit
        this.tracks[this.currentTrack].sort((a, b) => a.time - b.time);

        console.log(`Created note ${pitch} at position y=${position.y}`);
        return note;
    }

    createPlaybackLine() {
        // Vertikale Linie erstellen
        const points = [
            new BABYLON.Vector3(this.playbackStartPosition, -0.5, 0),  // Startpunkt unten
            new BABYLON.Vector3(this.playbackStartPosition, 1.5, 0)    // Endpunkt oben
        ];

        this.playbackLine = BABYLON.MeshBuilder.CreateLines("playbackLine", {
            points: points,
            updatable: true
        }, this.scene);

        this.playbackLine.color = new BABYLON.Color3(1, 0, 0); // Rote Linie
        this.playbackLine.setEnabled(false); // Initial unsichtbar
    }

    updatePlaybackLine(position) {
        const points = [
            new BABYLON.Vector3(position, -0.5, 0),
            new BABYLON.Vector3(position, 1.5, 0)
        ];
        this.playbackLine = BABYLON.MeshBuilder.CreateLines("playbackLine", {
            points: points,
            instance: this.playbackLine
        });
    }

    playTrack(trackIndex) {
        if (!this.tracks[trackIndex] || this.tracks[trackIndex].length === 0) {
            console.log("No notes to play");
            return;
        }

        // Stop any existing playback
        this.stopPlayback();

        const track = this.tracks[trackIndex];
        console.log("Playing track with", track.length, "notes");

        // Calculate total duration
        const duration = track[track.length - 1].time + 2; // Add 2 seconds buffer

        // Reset transport
        Tone.Transport.cancel();
        Tone.Transport.stop();

        // Schedule all notes
        track.forEach(note => {
            Tone.Transport.schedule((time) => {
                console.log("Playing note", note.pitch, "at time", time);
                this.sampler.triggerAttackRelease(note.pitch, note.duration, time);
            }, note.time);
        });

        // Playback line animation
        this.playbackLine.setEnabled(true);
        const frameRate = 30;
        const animation = new BABYLON.Animation(
            "playbackAnimation",
            "position.x",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
        );

        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: this.playbackStartPosition
        });
        keyFrames.push({
            frame: frameRate * duration,
            value: this.playbackEndPosition
        });

        animation.setKeys(keyFrames);
        this.playbackLine.animations = [animation];

        // Start animation and transport
        this.scene.beginAnimation(this.playbackLine, 0, frameRate * duration, false, 1, () => {
            this.stopPlayback();
        });

        // Ensure audio context is running and start transport
        Tone.start().then(() => {
            console.log("Audio context started");
            Tone.Transport.start();
        });
    }

    stopPlayback() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        this.scene.stopAnimation(this.playbackLine);
        this.playbackLine.setEnabled(false);
        this.updatePlaybackLine(this.playbackStartPosition);
    }

    exportToMidi() {
        // MIDI Export Logik implementieren
    }

    importFromMidi(file) {
        // MIDI Import Logik implementieren
    }

    setupEventListeners() {
        // Maus-Events für Noteneingabe
        this.scene.onPointerDown = (evt, pickResult) => {
            if (pickResult.hit) {
                const position = pickResult.pickedPoint;
                this.createNote(position);
            }
        };

        // UI Controls
        document.getElementById("playButton").onclick = () => {
            console.log("Play button clicked");
            this.playTrack(this.currentTrack);
        };

        document.getElementById("stopButton").onclick = () => {
            console.log("Stop button clicked");
            this.stopPlayback();
        };
        document.getElementById("tempoSlider").oninput = (e) => {
            this.tempo = e.target.value;
            Tone.Transport.bpm.value = this.tempo;
            document.getElementById("tempoValue").textContent = `${this.tempo} BPM`;
        };

        document.getElementById("exportMidi").onclick = () => this.exportToMidi();
        document.getElementById("importMidi").onchange = (e) => this.importFromMidi(e.target.files[0]);

        // Render Loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
}

// Editor initialisieren
const editor = new MusicScoreEditor();





