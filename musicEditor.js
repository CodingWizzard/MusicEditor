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
        this.secondsPerUnit = 1; // Zeit pro Einheit auf der X-Achse
        this.maxImportDuration = 5; // Maximale Importdauer in Sekunden

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
        // this.camera.attachControl(this.canvas, true);

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
        const noteHead = BABYLON.MeshBuilder.CreateSphere("noteHead", {
            diameter: 0.15
        }, this.scene);

        // Material für die Note
        const noteMaterial = new BABYLON.StandardMaterial("noteMaterial", this.scene);
        noteMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // Schwarz als Standardfarbe
        noteHead.material = noteMaterial;

        noteHead.position = position;

        // Konvertiere y-Position zu Tonhöhe
        const notePositions = {
            0.0: "F4",      // Erste Linie
            0.1: "F#4",     // Zwischen F4 und A4
            0.2: "G4",      // Zwischen F4 und A4
            0.3: "G#4",     // Zwischen F4 und A4
            0.4: "A4",      // Zweite Linie
            0.5: "A#4",     // Zwischen A4 und C5
            0.6: "B4",      // Zwischen A4 und C5
            0.7: "C5",      // Dritte Linie
            0.8: "C#5",     // Zwischen C5 und E5
            0.9: "D5",      // Zwischen C5 und E5
            1.0: "D#5",     // Zwischen C5 und E5
            1.1: "E5",      // Vierte Linie
            1.2: "F5",      // Zwischen E5 und G5
            1.3: "F#5",     // Zwischen E5 und G5
            1.4: "G5"       // Fünfte Linie
        };

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
        const duration = "4n";

        const note = {
            mesh: noteHead,
            pitch: pitch,
            duration: duration,
            position: position
        };

        this.tracks[this.currentTrack].push(note);
        this.tracks[this.currentTrack].sort((a, b) => a.position.x - b.position.x);

        console.log(`Created note ${pitch} at position x=${position.x}, y=${position.y}`);
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

        this.stopPlayback();
        const track = this.tracks[trackIndex];

        const totalDistance = this.playbackEndPosition - this.playbackStartPosition;
        const totalDuration = totalDistance * this.secondsPerUnit;

        // Reset transport and playback line
        Tone.Transport.cancel();
        Tone.Transport.stop();
        this.updatePlaybackLine(this.playbackStartPosition);
        this.playbackLine.setEnabled(true);

        // Schedule all notes
        track.forEach(note => {
            const relativePosition = (note.position.x - this.playbackStartPosition) / totalDistance;
            const noteTime = relativePosition * totalDuration;

            Tone.Transport.schedule((time) => {
                // Highlight the note
                const originalColor = note.mesh.material.diffuseColor;
                note.mesh.material = new BABYLON.StandardMaterial("highlightMaterial", this.scene);
                note.mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);

                this.sampler.triggerAttackRelease(note.pitch, note.duration, time);

                setTimeout(() => {
                    note.mesh.material = new BABYLON.StandardMaterial("noteMaterial", this.scene);
                    note.mesh.material.diffuseColor = originalColor;
                }, 500);
            }, noteTime);
        });

        // Implementiere manuelle Animation statt BABYLON Animation
        let startTime;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;

            const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
            const progress = Math.min(elapsedTime / totalDuration, 1);

            const newX = this.playbackStartPosition + (progress * totalDistance);
            this.updatePlaybackLine(newX);

            if (progress < 1 && this.playbackLine.isEnabled()) {
                requestAnimationFrame(animate);
            } else {
                this.stopPlayback();
            }
        };

        // Start playback
        Tone.start().then(() => {
            requestAnimationFrame(animate);
            Tone.Transport.start();
        });
    }

    stopPlayback() {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        this.playbackLine.setEnabled(false);
        this.updatePlaybackLine(this.playbackStartPosition);
    }

    exportToMidi() {
        // Erstelle neue MIDI-Datei
        const midi = new Midi();

        // Füge einen Track hinzu
        const track = midi.addTrack();

        // Setze Tempo
        midi.header.setTempo(this.tempo);

        // Konvertiere X-Position zu Ticks
        const xToTicks = (x) => {
            const normalizedPosition = (x - this.playbackStartPosition) /
                (this.playbackEndPosition - this.playbackStartPosition);
            return Math.round(normalizedPosition * midi.header.ticksPerBeat * 4); // 4 Beats pro Takt
        };

        // Konvertiere Y-Position zu MIDI Note
        const yToMidiNote = (y) => {
            const noteMapping = {
                0.0: 65,    // F4
                0.1: 66,    // F#4
                0.2: 67,    // G4
                0.3: 68,    // G#4
                0.4: 69,    // A4
                0.5: 70,    // A#4
                0.6: 71,    // B4
                0.7: 72,    // C5
                0.8: 73,    // C#5
                0.9: 74,    // D5
                1.0: 75,    // D#5
                1.1: 76,    // E5
                1.2: 77,    // F5
                1.3: 78,    // F#5
                1.4: 79     // G5
            };

            let closestY = 0.7; // Default to C5
            let minDistance = Number.MAX_VALUE;

            for (const pos in noteMapping) {
                const distance = Math.abs(y - pos);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestY = pos;
                }
            }

            return noteMapping[closestY];
        };

        // Füge alle Noten zum Track hinzu
        this.tracks[this.currentTrack].forEach(note => {
            const ticks = xToTicks(note.position.x);
            const midiNote = yToMidiNote(note.position.y);
            const duration = 480; // Standard-Länge (ein Beat)

            track.addNote({
                midi: midiNote,
                time: ticks / midi.header.ticksPerBeat,
                duration: 0.5, // Halbe Note
                velocity: 64 // Standard-Lautstärke
            });
        });

        // Exportiere als Blob und erstelle Download
        const blob = new Blob([midi.toArray()], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'score.mid';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromMidi(file) {
        // Überprüfe, ob es sich um eine MIDI-Datei handelt
        if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
            alert('Bitte wähle eine MIDI-Datei (.mid oder .midi) aus.');
            return;
        }

        // Bestehende Noten löschen
        this.tracks[this.currentTrack].forEach(note => {
            note.mesh.dispose();
        });
        this.tracks[this.currentTrack] = [];

        const reader = new FileReader();

        reader.onerror = (error) => {
            console.error('Fehler beim Lesen der MIDI-Datei:', error);
            alert('Die MIDI-Datei konnte nicht gelesen werden.');
        };

        reader.onload = async (e) => {
            try {
                const buffer = new Uint8Array(e.target.result);
                const midi = new Midi(buffer);

                // Konvertiere Zeit in Sekunden zu Ticks
                const secondsToTicks = (seconds) => {
                    const bpm = midi.header.tempos[0]?.bpm || 120;
                    const ticksPerBeat = midi.header.ticksPerBeat;
                    return (seconds * bpm * ticksPerBeat) / 60;
                };

                const maxTicks = secondsToTicks(this.maxImportDuration);

                // Konvertiere MIDI-Ticks zu X-Koordinaten
                const ticksToX = (ticks) => {
                    const normalizedPosition = ticks / maxTicks;
                    return this.playbackStartPosition +
                        (normalizedPosition * (this.playbackEndPosition - this.playbackStartPosition));
                };

                // Debug-Ausgaben
                console.log('MIDI Header:', {
                    ticksPerBeat: midi.header.ticksPerBeat,
                    timeSignature: midi.header.timeSignatures[0],
                    tempos: midi.header.tempos
                });

                // MIDI-Noten zu Y-Koordinaten konvertieren
                const midiNoteToY = (midiNote) => {
                    const noteMapping = {
                        65: 0.0,    // F4
                        66: 0.1,    // F#4
                        67: 0.2,    // G4
                        68: 0.3,    // G#4
                        69: 0.4,    // A4
                        70: 0.5,    // A#4
                        71: 0.6,    // B4
                        72: 0.7,    // C5
                        73: 0.8,    // C#5
                        74: 0.9,    // D5
                        75: 1.0,    // D#5
                        76: 1.1,    // E5
                        77: 1.2,    // F5
                        78: 1.3,    // F#5
                        79: 1.4     // G5
                    };

                    let closestNote = 72; // Default to C5
                    let minDistance = Number.MAX_VALUE;

                    for (const note in noteMapping) {
                        const distance = Math.abs(midiNote - note);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestNote = parseInt(note);
                        }
                    }

                    return noteMapping[closestNote];
                };

                // Verarbeite alle MIDI-Tracks
                midi.tracks.forEach((track, trackIndex) => {
                    if (!this.tracks[trackIndex]) {
                        this.tracks[trackIndex] = [];
                    }

                    if (track.notes && track.notes.length > 0) {
                        // Filtere Noten innerhalb der maximalen Dauer
                        const filteredNotes = track.notes.filter(note => note.ticks <= maxTicks);

                        filteredNotes.forEach(midiNote => {
                            const x = ticksToX(midiNote.ticks);
                            const y = midiNoteToY(midiNote.midi);

                            if (!isNaN(x) && !isNaN(y)) {
                                const position = new BABYLON.Vector3(x, y, 0);
                                const note = this.createNote(position);
                                note.duration = `${midiNote.duration}n`;
                                note.velocity = midiNote.velocity;
                            }
                        });
                    }
                });

                // Sortiere die Noten nach X-Position
                this.tracks.forEach(track => {
                    track.sort((a, b) => a.position.x - b.position.x);
                });

                console.log(`Imported MIDI file with ${midi.tracks.length} tracks`);
            } catch (error) {
                console.error('Fehler beim Verarbeiten der MIDI-Datei:', error);
                alert('Die MIDI-Datei konnte nicht verarbeitet werden.');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    setupEventListeners() {
        let isDragging = false;
        let selectedNote = null;

        // Rechtsklick verhindern
        this.canvas.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
        });

        // Mausklick-Handler
        this.scene.onPointerDown = (evt, pickResult) => {
            if (evt.button === 2) { // Rechte Maustaste
                if (pickResult.hit && pickResult.pickedMesh.name === "noteHead") {
                    // Note aus dem Track entfernen
                    this.tracks[this.currentTrack] = this.tracks[this.currentTrack].filter(note =>
                        note.mesh !== pickResult.pickedMesh
                    );
                    // Mesh entfernen
                    pickResult.pickedMesh.dispose();
                }
            } else if (evt.button === 0) { // Linke Maustaste
                if (pickResult.hit) {
                    if (pickResult.pickedMesh.name === "noteHead") {
                        // Existierende Note auswählen zum Verschieben
                        isDragging = true;
                        selectedNote = this.tracks[this.currentTrack].find(note =>
                            note.mesh === pickResult.pickedMesh
                        );
                    } else {
                        // Neue Note erstellen
                        const position = pickResult.pickedPoint;
                        this.createNote(position);
                    }
                }
            }
        };

        // Mausbewegung-Handler
        this.scene.onPointerMove = (evt, pickResult) => {
            if (isDragging && selectedNote) {
                const ray = this.scene.createPickingRay(
                    this.scene.pointerX,
                    this.scene.pointerY,
                    BABYLON.Matrix.Identity(),
                    this.camera
                );

                // Schnittpunkt mit der XY-Ebene berechnen
                const plane = new BABYLON.Plane(0, 0, 1, 0);
                let distance = ray.intersectsPlane(plane);

                if (distance) {
                    const newPosition = ray.origin.add(ray.direction.scale(distance));

                    // Position auf den erlaubten Bereich beschränken
                    const clampedX = Math.max(this.playbackStartPosition,
                        Math.min(this.playbackEndPosition, newPosition.x));
                    const clampedY = Math.max(0, Math.min(1.4, newPosition.y));

                    // Position aktualisieren
                    selectedNote.mesh.position.x = clampedX;
                    selectedNote.mesh.position.y = clampedY;
                    selectedNote.position = selectedNote.mesh.position;

                    // Tonhöhe aktualisieren
                    const notePositions = {
                        0.0: "F4",      // Erste Linie
                        0.1: "F#4",     // Zwischen F4 und A4
                        0.2: "G4",      // Zwischen F4 und A4
                        0.3: "G#4",     // Zwischen F4 und A4
                        0.4: "A4",      // Zweite Linie
                        0.5: "A#4",     // Zwischen A4 und C5
                        0.6: "B4",      // Zwischen A4 und C5
                        0.7: "C5",      // Dritte Linie
                        0.8: "C#5",     // Zwischen C5 und E5
                        0.9: "D5",      // Zwischen C5 und E5
                        1.0: "D#5",     // Zwischen C5 und E5
                        1.1: "E5",      // Vierte Linie
                        1.2: "F5",      // Zwischen E5 und G5
                        1.3: "F#5",     // Zwischen E5 und G5
                        1.4: "G5"       // Fünfte Linie
                    };

                    let closestPosition = 0;
                    let minDistance = Number.MAX_VALUE;

                    for (let pos in notePositions) {
                        const distance = Math.abs(clampedY - pos);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestPosition = pos;
                        }
                    }

                    selectedNote.pitch = notePositions[closestPosition];

                    // Track neu sortieren
                    this.tracks[this.currentTrack].sort((a, b) => a.position.x - b.position.x);
                }
            }
        };

        // Maus loslassen-Handler
        this.scene.onPointerUp = () => {
            isDragging = false;
            selectedNote = null;
        };

        // Bestehende Event-Listener
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

        document.getElementById("importMidi").onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importFromMidi(file);
            }
        };

        document.getElementById("importDuration").onchange = (e) => {
            this.setMaxImportDuration(parseFloat(e.target.value));
        };

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










