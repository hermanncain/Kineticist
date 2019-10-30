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
        this.camera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
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
            worldTransform: new Signal(),
            objectTransformed: new Signal(),
            transformModeChanged: new Signal(),
            // unit
            unitTypeChanged: new Signal(),
            unitMorphed: new Signal(),
            setMorphControl: new Signal(),
            removeMorphControl: new Signal(),
            // goLayout: new Signal(),
            leftbarChanged: new Signal(),
            sceneChanged: new Signal(),
            sceneCleared: new Signal(),

            // sculpture
            unitScaleChanged: new Signal(),
            sketchChanged: new Signal(),
            sculptureChanged: new Signal(),

            // info
            infoChanged: new Signal(),
        };
    }

    clear () {
        // 2.1 scenes
        this.unitScene = this.scene.clone();
        this.unitScene.name = 'unit-scene';
        this.sculptureScene = this.scene.clone();
        this.sculptureScene.name = 'sculpture-scene';
        this.currentScene = this.unitScene;

        // this.scenes = {};
        // this.scenes.unitScene = this.scene.clone();
        // this.scenes.unitScene.name = 'unitScene';        
        // this.scenes.sketchScene = this.scene.clone();
        // this.scenes.sketchScene.name = 'sketchScene';
        // this.scenes.layoutScene = this.scene.clone();
        // this.scenes.layoutScene.name = 'layoutScene';
        // this.currentScene = this.scenes.unitScene;        

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
        // this.selectedSketch = null;
        // this.selectedSculpture = null;
        this.selectedGroup = [];
        this.selectedObjects = [];

        // 2.5 singletons: unit, axis and sculpture
        this.unit = new Unit();
        this.unit.setMaterial(grayMaterial);
        this.unitScene.add(this.unit);
        // this.scenes.unitScene.add(this.unit);
        // this.axis = null;
        this.sculpture = new KineticSculpture();
        this.sculpture.unit = this.unit;
        this.sculptureScene.add(this.sculpture);
        // this.scenes.layoutScene.add(this.sculpture);

        // 2.6 sketches
        this.sketches = [];
        
        // 2.7 sculpture morphing controls
        this.currentMorph = '';
        this.unitMorphKeys = {bias:[],rotation:[],size:[]};
        // TODO
        // this.ribMorphKeys = {bias:[],rotation:[],size:[]};
        // this.decMorphKeys = [];

        // 2.8 simulation control
        this.isPlay = false;
    }

    select (object,multi=false) {

        // multi-select / single select
        if (multi) {
            // has selected in multi-selection, remove
            if ( this.selectedObjects.indexOf(object)>-1 ) {
                this.unselect(object);
                this.selectedObjects.splice(this.selectedObjects.indexOf(object),1);
            } else {
                if (object instanceof Rib) {
                    this.selectedObjects.push(object);
                    this.selected = object;
                    this.selected.select();
                }
            }
        } else {
            // select the same object
            if ( this.selected === object ) {
                if (this.selectedObjects.length>0) {
                    this.multiUnselect();
                } else {
                    return;
                }
            }
            // unselect previous selected
            if (this.selected != null) {
                this.unselect(this.selected);
            }
            if (this.selectedObjects.length>0) {
                this.multiUnselect();
            }
            this.selected = object;
            if (object != null) {
                if (this.selected instanceof Sketch || this.selected instanceof Rib) {
                    this.selected.select();
                } else if (this.selected instanceof Unit) {
                    if (this.currentMorph=='') {
                        this.selected = null;
                    } else {
                        this.selected.setMaterial(selectedMaterial);
                    }
                }
            } else {
                this.multiUnselect();
            }
        }

		this.signals.objectSelected.dispatch( this.selected );
    }

    unselect(object) {
        if (object == null) return;

        if(object instanceof Sketch || object instanceof Rib) {
            object.deselect();
        } else if (object.name == 'ribpoint') {
            object.material.color.setHex(0x0000ff);
        } else if (object.name == 'control point') {
            object.material.color.setHex(0x0000ff);
            object.material.color.copy(object.parent.material.color);
        } else if (object instanceof Unit) {
            if (this.showKeys) {
                let isKey = false;
                for (let key in this.unitMorphKeys) {
                    if (this.unitMorphKeys[key].indexOf(object)>-1) {
                        isKey = true;
                        break;
                    }
                }
                if (isKey) {
                    object.setMaterial(labeledMaterial);
                } else {
                    object.setMaterial(this.currentMaterial);
                }
            } else {
                object.setMaterial(this.currentMaterial);
            }
        }
    }

    multiUnselect() {
        for (let obj of this.selectedObjects) {
            this.unselect(obj);
        }
        this.selectedObjects = [];
    }

    deselect () {
        this.select(null);
    }

    remove (object) {
        if (!object) return;
        if (object instanceof Rib) {
            this.unit.removeRib(object);
        } else if (object instanceof Sketch) {
            this.removeSketch(object);
            object.dispose();
        }
        this.deselect();
    }

    // sketch operations
    addSketch (sketch) {
        this.sculptureScene.add(sketch);
        this.sketches.push(sketch);
        this.signals.sketchChanged.dispatch();
    }
    removeSketch (sketch) {
        this.sculptureScene.remove(sketch);
        if (this.sketches.indexOf(sketch)>-1) {
            this.sketches.splice(this.sketches.indexOf(sketch),1);
            this.signals.sketchChanged.dispatch();
        }
        // if (this.axis == sketch) {
        //     this.axis = null;
        // }
    }
    setRole (sketch, role) {
        if (sketch.role == role) {
            return;
        }
        let s = this.sculpture;
        s.contours = [];
        // set original axis/reference as sketch
        if (role == 'axis' || role == 'reference') {
            for (let curve of this.sketches) {
                if (curve.role == role) {
                    curve.setRole('sketch');
                    break;
                }
            }
        }
        sketch.setRole(role);
        for (let curve of this.sketches) {
            if (curve.role=='axis') {
                s.axis = curve;
            } else if (curve.role=='reference') {
                s.reference = curve;
            } else if (curve.role=='contour') {
                s.contours.push(curve);
            }
        }
        if (role == 'axis') {
            this.signals.unitScaleChanged.dispatch();
        }
    }

    switchScene(name) {
        if (name == 'unit-scene') {
            this.currentScene = this.unitScene;
        } else {
            this.currentScene = this.sculptureScene;
        }
        this.signals.sceneChanged.dispatch(name);
    }

    changeScene (name) {
        // for (let key in this.scenes) {
        //     this.scenes[key].background = backgrounds[name];
        // }
        if (name != 'none'){
            metalMaterial.envMap = backgrounds[name];
        }
        this.unitScene.background = backgrounds[name];
        this.sculptureScene.background = backgrounds[name];
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

    layout(p) {
        // if (!this.sculpture.axis) {
        //     this.setRole(this.sketches[0],'axis');
        // }
        this.sculpture.layout(this.unit,p);
        this.resetMorphKeys();
        this.signals.objectSelected.dispatch(null);
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

    solveSkeletons (n) {
        let STSketches = [];
        this.sculpture.sketches.map(function(c){
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
        this.unit.dispose();
        this.solver = new prototypeSolver(STSketches,null,n,this.unit,this.sculpture);
        this.solver.initializeAxis(true);
        this.axis = this.solver.axis;
        // this.scenes.layoutScene.add(this.axis);
    }

    testAxisGen (n) {
        this.solver.n = n;
        // this.scenes.layoutScene.remove(this.solver.axis);
        this.solver.generateAxis(false);
        // this.solver.searchJunctionEnvelopes();
        this.solver.searchAxisByJuncEnv();
        this.axis = this.solver.axis;
        // this.scenes.layoutScene.add(this.axis);
    }

    testJunction (n) {
        // if (this.unit.skeleton.children.length==0) {
        //     this.sculpture.unit = this.unit;
        // } else {
        //     this.sculpture.unit = new Unit();
        // }
        // let params = {
        //     n,
        //     scale:1,
        //     torsion:0,
        // }
        
        // this.sculpture.setSleeveRadii();
        // this.axis.sample(n);
        // this.sculpture.layout(this.sculpture.unit, params,true);
        // if(this.sculpture.buildJoints()) {
        //     signals.infoChanged.dispatch('Got a feasible solution.');
        // } else {

        // }
        this.solver.initializeJunctionEnvelopes();
    }

    toJSON() {
        let scope = this;
        return {
            // save morph control unit indices
            morphControlIdx: {
                bias: this.unitMorphKeys.bias.map(function(u){
                    return scope.sculpture.units.children.indexOf(u);
                }),
                rotation: this.unitMorphKeys.rotation.map(function(u){
                    return scope.sculpture.units.children.indexOf(u);
                }),
                size: this.unitMorphKeys.size.map(function(u){
                    return scope.sculpture.units.children.indexOf(u);
                }),
            },
            // save unit
            unit: this.unit.toJSON(),
            // save sketches
            sketches: this.sketches.map(function(s){
                return s.toJSON();
            }),
            // save sculpture
            sculpture: this.sculpture.toJSON(),
        }
    }

    fromJSON(data) {
        this.clear();
        // restore unit
        this.unit.fromJSON(data.unit);
        // restore sketches
        for (let sketchData of data.sketches) {
            let sketch = new Sketch().fromJSON(sketchData);
            this.addSketch(sketch);
            // restore sculpture axis and sketches
            if (sketch.eid == data.sculpture.axisId) {
                this.sculpture.setAxis(sketch);
                this.axis = sketch;
            } else if (data.sculpture.sketchIds.indexOf(sketch.eid)>=0) {
                this.sculpture.addContour(sketch);
            }
        }
        // relayout
        this.layout(data.sculpture.params);
        // restore morphkeys
        for (let key in this.unitMorphKeys) {
            this.unitMorphKeys[key] = [];
            for (let i of data.morphControlIdx[key]) {
                this.unitMorphKeys[key].push(this.sculpture.units.children[i]);
            }
        }
        // remorph
        this.sculpture.fromJSON(data.sculpture);
        
        this.signals.sceneChanged.dispatch('unitScene');
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

}

    
