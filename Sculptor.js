/**
 * @class Sculptor
 * core class
 */

class Sculptor {

    constructor () {

        var scope = this;

        // 1. resource initialization        
        // 1.1 scene backgrounds
        var cubemapLoader = new THREE.CubeTextureLoader();
        function loadCubeMap(name) {
            cubemapLoader.setPath( 'cubemaps/'+name+'/' );
            var texture = cubemapLoader.load( [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ] );
            texture.name = name;
            return texture;
        }
        var pureColor = new THREE.Color(0xffffff);
        pureColor.name = 'none';
        this.sceneBackgroundLib = {
            'none': pureColor,
            'scene1': loadCubeMap('scene1'),
            'scene2': loadCubeMap('scene2')
        };

        // 1.2 materials
        this.materialNames = ['standard','toon','reflective','glass','custom'];
        this.materials = {};
        var mats = [];
        mats[0] = new THREE.MeshStandardMaterial({color:0x484848, emissive: 0x464646, roughness:1, metalness:0});
        mats[1] = new THREE.MeshToonMaterial({color:0x8c8c8c, specular:0x000000,reflectivity:0, shininess:1 });
        mats[2] = new THREE.MeshBasicMaterial();
        mats[3] = new THREE.MeshPhongMaterial( { color: 0xffffff, refractionRatio: 0.985 } );
        mats[4] = new THREE.MeshBasicMaterial();
        for (let i=0;i<mats.length;i++) {
            this.materials[this.materialNames[i]]=mats[i];
            mats[i].name = this.materialNames[i];
            mats[i].side = THREE.DoubleSide;
        }
        this.unitMaterial = mats[0];
        this.selectedMaterial = mats[0].clone();
        this.selectedMaterial.color.setHex(0x0099FF);

        // 1.3 meta scene
        this.scene = new THREE.Scene();
        this.scene.background = this.sceneBackgroundLib['none'];
        var lights = [];
        lights[ 0 ] = new THREE.AmbientLight( 0x787878 );
        lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 3 ] = new THREE.PointLight( 0xffffff, 1, 0 );
        lights[ 1 ].position.set( 0, 200, 0 );
        lights[ 2 ].position.set( 100, 200, 100 );
        lights[ 3 ].position.set( - 100, - 200, - 100 );
        lights.map(function(l){scope.scene.add(l);});

        // 1.4 helper scene
        this.sceneHelpers = new THREE.Scene();
        var axesHelper = new THREE.AxesHelper(5);
        axesHelper.layers.set(6);
        this.sceneHelpers.add(axesHelper);

        // 1.5 camera
        this.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
        this.initialCameraPosition = new THREE.Vector3( 0, 0, 50);
        // control visibility of points, lines, skeletons and unit meshes
        this.camLayers = 6;
        for (let i=1;i<=this.camLayers;i++) {
            this.camera.layers.enable(i);
        }
        this.camera.position.set(0,0,50);
        
        // 1.6 canvas for drawing
        // 1.6.1 canvas for drawing unit skeletons
        this.unitCanvas = new THREE.Mesh(new THREE.PlaneBufferGeometry(200,200));
        this.unitCanvas.position.set(0,0,0);
        // 1.6.2 canvas for drawing sketches
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
        this.currentScene = this.scenes.unitScene;

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
        this.unit.setMaterial(this.unitMaterial);
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
                this.selected.setMaterial(this.unitMaterial);
            }
        }
        if (object != null) {
            if (object.name == 'sleeve'||object.name=='blades'||object.name=='accessory'||object.name=='transmission') {
                this.selected = object.parent.parent;
                // console.log(this.selected)
            } else if (object instanceof Rib && this.currentScene.name == 'layoutScene') {
                // console.log(this.selected)
            } else if (object.name == 'shape') {
                this.selected = object.parent;
            } else {
                // console.log(object)
                this.selected = object;
            }
            if (this.selected.type == 'Unit') {
                this.selected.setMaterial(this.selectedMaterial);
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
        // this.contours.push(sketch);
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
            this.scenes[key].background = this.sceneBackgroundLib[name];
        }
        if (name != 'none'){
            this.updateMatMap(this.sceneBackgroundLib[name]);
        }
    }

    setUnitMaterial(name) {
        let scope = this;
        this.unitMaterial = this.materials[name];
        if (name == 'glass') {
            if(!this.materials[name].envMap) {
                this.updateMatMap(this.sceneBackgroundLib['scene1'])
            }
            this.materials[name].envMap.mapping = THREE.CubeRefractionMapping;
        } else if (name == 'reflective') {
            if(!this.materials[name].envMap) {
                this.updateMatMap(this.sceneBackgroundLib['scene1'])
            }
            this.materials[name].envMap.mapping = 301;
        }
        this.unit.setMaterial(this.unitMaterial);
        this.scenes.layoutScene.traverse(function(obj) {
            if (obj.type == 'Unit') {
                obj.setMaterial(scope.unitMaterial);
            }
        });
    }

    updateMatMap(map) {
        this.materials['reflective'].envMap = map;
        this.materials['glass'].envMap = map;
    }

    setAsAxis (sketch) {
        if (sketch.curveType == 'axis') return;
        sketch.setCurveType('axis');
        if (this.axes.indexOf(sketch)<0) {
            this.axes.push(sketch);
            this.sculptures[sketch.uuid] = new KineticSculptureBranch(sketch);
        }
        // this.scenes.sketchScene.add(this.sculptures[sketch.uuid]);
        this.selectSculpture(sketch);
        this.signals.sketchChanged.dispatch(sketch);
    }

    setAsContour (sketch) {
        if (sketch.curveType == 'contour') return;
        sketch.setCurveType('contour');
        if (this.axes.indexOf(sketch)>-1) {
            this.axes.splice(this.axes.indexOf(sketch),1);
            delete this.sculptures[sketch.uuid];
        }
        this.signals.sketchChanged.dispatch(sketch);
    }

    appendReference(ref) {
        this.selectedSculpture.addReference(ref);
        this.signals.selectModeChanged.dispatch('normal');
        this.select(null);
    }
    attachToSculpture(axis) {
        let sculpture = this.sculptures[axis.uuid];
        if (sculpture==undefined) {
            alert('please set the curve as axis first!');
        } else {
            sculpture.addReference(this.selectedSketch);
            this.signals.selectModeChanged.dispatch('normal');
            axis.deselect();
            this.select(null);
        }
    }
    layout(p) {
        this.sculpture.arrange(this.unit,p);
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
        this.sculpture = new KineticSculptureBranch().fromJSON(data);
        this.sculpture.units.children.map(function(u){u.setMaterial(scope.unitMaterial)});

        // restore the singleton unit
        this.unit = this.sculpture.unit;
        this.unit.setMaterial(this.unitMaterial);
        this.scenes.unitScene.add(this.unit);

        // restore sketches
        let axis = this.sculpture.axis;
        this.sculptures[axis.uuid] = this.sculpture;

        // restore sketches
        this.sketches = [axis];
        this.sketches.push(...this.sculpture.references);
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