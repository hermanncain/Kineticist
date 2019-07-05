/**
 * @class Sculptor
 * core class
 */

class Sculptor {

    constructor () {

        var scope = this;

        // 1 Objects
        // 1.1 meta scene
        this.scene = new THREE.Scene();
        this.scene.background = backgrounds['none'];
        var lights = [];
        lights[ 0 ] = new THREE.AmbientLight( 0x787878 );
        lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 3 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 1 ].position.set( 0, 200, 0 );
        lights[ 2 ].position.set( 100, 200, 100 );
        lights[ 3 ].position.set( - 100, - 200, - 100 );
        lights.map(function(l){scope.scene.add(l);});

        // 1.2 helper scene
        this.sceneHelpers = new THREE.Scene();
        var axesHelper = new THREE.AxesHelper(5);
        axesHelper.layers.set(6);
        this.sceneHelpers.add(axesHelper);

        // 1.3 camera
        this.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
        this.initialCameraPosition = new THREE.Vector3( 0, 0, 50);
        // control visibility of points, lines, skeletons and unit meshes
        this.camLayers = 6;
        for (let i=1;i<=this.camLayers;i++) {
            this.camera.layers.enable(i);
        }
        this.camera.position.set(0,0,50);
        
        // 1.4 canvas for drawing
        // 1.4.1 canvas for drawing unit skeletons
        this.unitCanvas = new THREE.Mesh(new THREE.PlaneBufferGeometry(200,200));
        this.unitCanvas.position.set(0,0,0);
        // 1.4.2 canvas for drawing sketches
        this.sketchCanvas = new THREE.Mesh(new THREE.PlaneBufferGeometry(200,200));
        this.sketchCanvas.position.set(0,0,-50)
        this.camera.add(this.sketchCanvas);

        // 2 data
        // 2.1 - 2.9 
        this.clear();

        // 3 event manager
        var Signal = signals.Signal;
        this.signals = {
            windowResize: new Signal(),
            cameraChanged: new Signal(),
            drawModeChanged: new Signal(),
            play: new Signal(),
            pause: new Signal(),
            generateSkeleton: new Signal(),
            // selection
            objectSelected: new Signal(),
            pointSelected: new Signal(),
            sketchSelected: new Signal(),
            sculptureSelected: new Signal(),
            selectModeChanged: new Signal(),
            pointChanged: new Signal(),
            sketchChanged: new Signal(),
            worldTransform: new Signal(),
            
            objectTransformed: new Signal(),
            transformModeChanged: new Signal(),
            // unit
            unitTypeChanged: new Signal(),
            // goLayout: new Signal(),
            leftbarChanged: new Signal(),
            sceneChanged: new Signal(),

            // sculpture
            sculptureChanged: new Signal(),

            // info
            infoChanged: new Signal(),
        };
    }

    clear () {
        // 2.1 scenes
        this.scenes = {};
        this.scenes.unitScene = this.scene.clone();
        this.scenes.unitScene.name = 'unitScene';        
        this.scenes.sketchScene = this.scene.clone();
        this.scenes.sketchScene.name = 'sketchScene';
        this.scenes.layoutScene = this.scene.clone();
        this.scenes.layoutScene.name = 'layoutScene';
        this.currentScene = this.scenes.sketchScene;
        this.currentMaterial = grayMaterial;
        this.showKeys = false;

        // 2.2 drawing modes
        this.drawMode = 'normal';
        // 2.3 selecting modes
        // for selecting an object
        // or appending a reference curve to an axis
        this.selectMode = 'normal';

        // 2.4 selections
        this.selected = null;
        this.selectedSketch = null;
        this.selectedSculpture = null;
        this.selectedGroup = [];

        // 2.5 singleton unit
        this.unit = new Unit();
        this.unit.setMaterial(grayMaterial);
        this.scenes.unitScene.add(this.unit);

        // 2.6 sketches
        this.sketches = [];
        this.axes = [];

        // 2.7 sculptures
        this.sculptures = {};
        this.sculpture = null;
        
        // 2.8 sculpture morphing controls
        this.unitMorphKeys = {bias:[],rotation:[],size:[]};
        // TODO
        // this.ribMorphKeys = {bias:[],rotation:[],size:[]};
        // this.decMorphKeys = [];

        // 2.9 simulation control
        this.isPlay = false;
    }

    select (object) {
        // select the same object
        if ( this.selected === object ) return;
        // handle previous selected object
        if (this.selected != null) {
            // deselect sketch
            if(this.selected.name == 'sketch line') {
                this.selected.parent.deselect();
            } else if (this.selected instanceof Rib) {
                this.selected.deselect();
            } else if (this.selected.name == 'ribpoint') {
                this.selected.material.color.setHex(0x0000ff);
            } else if (this.selected.type == 'Unit') {
                if (this.showKeys) {
                    let isKey = false;
                    for (let key in this.unitMorphKeys) {
                        if (this.unitMorphKeys[key].indexOf(this.selected)>-1) {
                            isKey = true;
                            break;
                        }
                    }
                    if (isKey) {
                        this.selected.setMaterial(labeledMaterial);
                    } else {
                        this.selected.setMaterial(this.currentMaterial);
                    }
                } else {
                    this.selected.setMaterial(this.currentMaterial);
                }
            }
        }
        if (object != null) {
            this.selected = object;
            // console.log(this.selected)
            if (this.selected.type == 'Unit') {
                // this.selected.select();
                this.selected.setMaterial(selectedMaterial);
            } else {
                this.selected = object;
            }
        } else {
            this.selected = object;
        }
        // console.log('sculptor',this.selected)
		this.signals.objectSelected.dispatch( this.selected );
    }

    deselect () {
        this.select(null);
    }

    deselectGroup() {
        if (this.selectedGroup.length==0) return;
        if (this.selectedGroup[0] instanceof Rib) {
            this.selectedGroup.map(function(rib){rib.deselect()});
        } else if (this.selectedGroup[0].name == 'ribpoint') {
            this.selectedGroup.map(function(pt){
                pt.material.color.setHex(0x0000ff);
            });
        }
    }

    remove (object) {
        if (!object) return;
        if (object instanceof Rib) {
            this.unit.removeRib(object);
        } else if (object.name = 'sketch line') {
            this.removeSketch(object.parent);
        } else if (object.name = 'control point'){
        } else {
            this.scene.remove(object);
        }
        this.deselect ();
    }

    selectSketch (sketch) {
        if (sketch != null) {
            sketch.select();
        }
        this.selectedSketch = sketch;
        this.signals.sketchSelected.dispatch(sketch);
    }

    selectSculpture (sketch) {
        if (sketch == null) {
            this.selectedSculpture = null;
        } else {
           this.selectedSculpture = this.sculptures[sketch.uuid]; 
           this.sculpture = this.selectedSculpture;
        }
        this.signals.sculptureSelected.dispatch(this.selectedSculpture);
    }

    addSketch (sketch) {
        this.scenes.sketchScene.add(sketch);
        this.sketches.push(sketch);
        // this.sketches.push(sketch);
    }

    removeSketch (sketch) {
        this.scenes.sketchScene.remove(sketch);
        if (this.sketches.indexOf(sketch)>-1) {
            this.sketches.splice(this.sketches.indexOf(sketch),1);
        }
        if (this.axes.indexOf(sketch)>-1) {
            this.axes.splice(this.axes.indexOf(sketch),1);
        }
        // TODO
        // remove related skeletons if exist
    }

    switchScene (name) {
        for (let key in this.scenes) {
            this.scenes[key].background = backgrounds[name];
        }
        if (name != 'none'){
            metalMaterial.envMap = backgrounds[name];
        }
    }

    setMaterial (mat) {
        this.currentMaterial = mat;
        sculptor.unit.setMaterial(mat);
        if (this.sculpture) {
            this.sculpture.units.children.map(function(u){
                u.setMaterial(mat);
            });
        }
    }

    setAsAxis (sketch) {
        if (sketch.role == 'axis') return;
        sketch.setRole('axis');
        if (this.axes.indexOf(sketch)<0) {
            this.axes.push(sketch);
            this.sculptures[sketch.uuid] = new KineticSculpture(sketch);
        }
        // this.scenes.sketchScene.add(this.sculptures[sketch.uuid]);
        this.selectSculpture(sketch);
        this.signals.sketchChanged.dispatch(sketch);
    }

    // TODO
    // contour or sketch?
    setAsContour (sketch) {
        if (sketch.role == 'contour') return;
        sketch.setRole('contour');
        if (this.axes.indexOf(sketch)>-1) {
            this.axes.splice(this.axes.indexOf(sketch),1);
            delete this.sculptures[sketch.uuid];
        }
        this.signals.sketchChanged.dispatch(sketch);
    }

    appendSketch(sketch) {
        this.selectedSculpture.appendSketch(sketch);
    }

    // appendReference(ref) {
    //     this.selectedSculpture.appendSketch(ref);
    //     // commented out for continuous selection & appending
    //     // this.signals.selectModeChanged.dispatch('normal');
    //     // this.select(null);
    // }
    attachToSculpture(axis) {
        let sculpture = this.sculptures[axis.uuid];
        if (sculpture==undefined) {
            alert('please set the curve as axis first!');
        } else {
            sculpture.appendSketch(this.selectedSketch);
            this.signals.selectModeChanged.dispatch('normal');
            axis.deselect();
            this.select(null);
        }
    }
    layout(p) {
        this.sculpture.layout(this.unit,p);
        this.resetMorphKeys();
    }

    resetMorphKeys() {
        this.unitMorphKeys.bias = [];
        this.unitMorphKeys.rotation = [];
        this.unitMorphKeys.size = [];

        this.unitMorphKeys.bias.push(this.sculpture.units.children[0]);
        this.unitMorphKeys.bias.push(this.sculpture.units.children[this.sculpture.units.children.length-1]);
        this.unitMorphKeys.rotation.push(this.sculpture.units.children[0]);
        this.unitMorphKeys.rotation.push(this.sculpture.units.children[this.sculpture.units.children.length-1]);
        this.unitMorphKeys.size.push(this.sculpture.units.children[0]);
        this.unitMorphKeys.size.push(this.sculpture.units.children[this.sculpture.units.children.length-1]);

    }

    solveSkeletons () {
        let STSketches = [];
        this.sketches.map(function(c){
            if (STSketches[c.timeOrder-1] === undefined) {
                STSketches[c.timeOrder-1] = [c];
            } else {
                STSketches[c.timeOrder-1].push(c);
            }
        });
        let M = STSketches[0].length;
        for (let sketch of STSketches) {
            if (M!=sketch.length) {
                alert('sketches should have the same number of curves!');
                return;
            }
        }
        this.solver = new prototypeSolver(STSketches);
        // solver.buildSkeletons();
        // for (let sculpture of solver.sculptures) {
        //     this.scenes.layoutScene.add(sculpture);
        // }
        this.solver.solve();
        this.addSketch(this.solver.axis);
        // this.sketches.push(this.solver.axis);
        this.setAsAxis(this.solver.axis);
        // this.scenes.sketchScene.add(this.solver.axis);
        // this.scenes.layoutScene.add(this.solver.sculpture);
        
    }

    testAxisGen () {
        // this.scenes.sketchScene.remove(this.solver.axis);
        this.removeSketch(this.solver.axis);
        this.solver.generateAxis();
        // this.sketches.push(this.solver.axis);
        
        this.addSketch(this.solver.axis);
        this.setAsAxis(this.solver.axis);
    }

    toJSON() {
        // morph key indices
        var scope = this;
        var arr = scope.sculpture.units.children;
        var sculptureJSON = this.sculpture.toJSON();
        sculptureJSON.biasControls = this.unitMorphKeys.bias.map(function(u){return arr.indexOf(u);});
        sculptureJSON.rotationControls = this.unitMorphKeys.rotation.map(function(u){return arr.indexOf(u);});
        sculptureJSON.sizeControls = this.unitMorphKeys.size.map(function(u){return arr.indexOf(u);});

        return sculptureJSON;
    }

    fromJSON(data) {

        let scope = this;
        this.clear();

        // restore sculptures
        this.sculpture = new KineticSculpture().fromJSON(data);
        this.sculpture.units.children.map(function(u){u.setMaterial(scope.unitMaterial)});

        // restore the singleton unit
        this.unit = this.sculpture.unit;
        this.unit.setMaterial(grayMaterial);
        this.scenes.unitScene.add(this.unit);

        // restore sketches
        let axis = this.sculpture.axis;
        this.sculptures[axis.uuid] = this.sculpture;

        // restore sketches
        this.sketches = [axis];
        this.sketches.push(...this.sculpture.sketches);
        this.axes = [axis];
        
        // restore sculpture morphing controls
        let arr = this.sculpture.units.children;
        this.unitMorphKeys.bias = data.biasControls.map(function(i){return arr[i];});
        this.unitMorphKeys.rotation = data.rotationControls.map(function(i){return arr[i];});
        this.unitMorphKeys.size = data.sizeControls.map(function(i){return arr[i];});

        this.sculpture.buildAxis();
        this.sculpture.buildBearings();

        this.signals.sceneChanged.dispatch('unitScene');
    }

}