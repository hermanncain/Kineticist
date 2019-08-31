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
        // this.selectedSketch = null;
        // this.selectedSculpture = null;
        this.selectedGroup = [];

        // 2.5 singletons: unit, axis and sculpture
        this.unit = new Unit();
        this.unit.setMaterial(grayMaterial);
        this.scenes.unitScene.add(this.unit);
        this.axis = null;
        this.sculpture = new KineticSculpture();
        this.sculpture.unit = this.unit;
        this.scenes.layoutScene.add(this.sculpture);

        // 2.6 sketches
        this.sketches = [];
        
        // 2.7 sculpture morphing controls
        this.unitMorphKeys = {bias:[],rotation:[],size:[]};
        // TODO
        // this.ribMorphKeys = {bias:[],rotation:[],size:[]};
        // this.decMorphKeys = [];

        // 2.8 simulation control
        this.isPlay = false;
    }

    select (object) {

        // select the same object
        if ( this.selected === object ) return;

        // handle previous selected object
        if (this.selected != null) {
            // deselect
            if(this.selected instanceof Sketch || this.selected instanceof Rib) {
                this.selected.deselect();
            } else if (this.selected.name == 'ribpoint') {
                this.selected.material.color.setHex(0x0000ff);
            } else if (this.selected.name == 'control point') {
                this.selected.material.color.setHex(0x0000ff);
                this.selected.material.color.copy(this.selected.parent.material.color);
            } else if (this.selected instanceof Unit) {
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

        // handle current selecting object
        if (object != null) {
            this.selected = object;
            if (this.selected instanceof Sketch || this.selected instanceof Rib) {
                this.selected.select();
            } else if (this.selected instanceof Unit) {
                this.selected.setMaterial(selectedMaterial);
            }
        } else {
            this.selected = object;
        }
		this.signals.objectSelected.dispatch( this.selected );
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

    addSketch (sketch) {
        this.scenes.sketchScene.add(sketch);
        this.sketches.push(sketch);
    }

    removeSketch (sketch) {
        this.scenes.sketchScene.remove(sketch);
        if (this.sketches.indexOf(sketch)>-1) {
            this.sketches.splice(this.sketches.indexOf(sketch),1);
        }
        if (this.axis == sketch) {
            this.axis = null;
        }
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

    // set curve's roles
    setRole (sketch, role) {
        if (sketch.role == role) {
            return;
        }
        switch (role) {
            case 'sketch':
                if (sketch.role == 'axis') {
                    this.axis = null;
                    this.sculpture.setAxis(null);
                } else if (sketch.role == 'contour') {
                    this.sculpture.removeContour(sketch);
                }
                sketch.setRole(role);
            case 'contour':
                if (sketch.role == 'axis') {
                    this.axis = null;
                }
                this.sculpture.addContour(sketch);
            break;
            case 'axis':
                if (sketch.role == 'contour') {
                    this.sculpture.removeContour(sketch);
                } else if (this.axis) {
                    this.axis.setRole('sketch');
                }
                this.sculpture.setAxis(sketch);
                this.axis = sketch;
            break;
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
        this.scenes.layoutScene.add(this.axis);
    }

    testAxisGen (n) {
        this.solver.n = n;
        this.scenes.layoutScene.remove(this.solver.axis);
        this.solver.generateAxis(false);
        // this.solver.searchJunctionEnvelopes();
        this.solver.searchAxisByJuncEnv();
        this.axis = this.solver.axis;
        this.scenes.layoutScene.add(this.axis);
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

        // restore axis
        let axis = this.sculpture.axis;

        // restore sketches
        this.sketches = [axis];
        this.sketches.push(...this.sculpture.sketches);
        // this.axes = [axis];
        this.axis = axis;
        
        // restore sculpture morphing controls
        let arr = this.sculpture.units.children;
        this.unitMorphKeys.bias = data.biasControls.map(function(i){return arr[i];});
        this.unitMorphKeys.rotation = data.rotationControls.map(function(i){return arr[i];});
        this.unitMorphKeys.size = data.sizeControls.map(function(i){return arr[i];});

        this.sculpture.buildAxis();
        this.sculpture.buildBearings();

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

    
