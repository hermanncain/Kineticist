Rightbar.Scene = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('rightbar-scene');

    // camera
    var cameraRow = new UI.Row().setId('camera-row');
    container.add(cameraRow);
    cameraRow.add(new UI.Text('Camera').setFontSize('20px'));

    // camera layers
    let layerRow = new UI.Row();
    cameraRow.add(layerRow);
    layerRow.add(new UI.Text('visibility').setWidth('100%').setMargin('10px'));
    // point layer
    let pointLayer = new UI.Button().setId('point-layer').onClick(function(){
        updateLayer(1);
    });
    layerRow.add(pointLayer);
    // line layer
    let lineLayer = new UI.Button().setId('line-layer').onClick(function(){
        updateLayer(2);
    });
    layerRow.add(lineLayer);
    // bone layer
    let boneLayer = new UI.Button().setId('bone-layer').onClick(function(){
        updateLayer(3);
    });
    layerRow.add(boneLayer);
    // mesh layer
    let meshLayer = new UI.Button().setId('mesh-layer').onClick(function(){
        updateLayer(4);
    });
    layerRow.add(meshLayer);
    // envelope layer
    let envelopeLayer = new UI.Button().setId('env-layer').onClick(function(){
        updateLayer(5);
    });
    layerRow.add(envelopeLayer);
    // helper layer
    let helperLayer = new UI.Button().setId('helper-layer').onClick(function(){
        updateLayer(6);
    });
    layerRow.add(helperLayer);
    let layers = [pointLayer, lineLayer, boneLayer, meshLayer,envelopeLayer,helperLayer];
    
    // camera transforms
    let camTransRow = new UI.Row().setWidth('180px')//.setMarginLeft('20px');
    cameraRow.add(camTransRow);
    camTransRow.add(new UI.Text('perspective').setWidth('100%').setMargin('10px'));
    // front
    let frontView = new UI.Button().setId('front-view').onClick(update);
    camTransRow.add(frontView);
    // left
    let leftView = new UI.Button().setId('left-view').onClick(update);
    camTransRow.add(leftView);
    // top
    let topView = new UI.Button().setId('top-view').onClick(update);
    camTransRow.add(topView);
    // axonometric
    let axonometricView = new UI.Button().setId('axonometric-view').onClick(update);
    camTransRow.add(axonometricView);
    // focus
    let focusView = new UI.Button().setId('focus-view').onClick(update);
    camTransRow.add(focusView);
    // move
    let orbitView = new UI.Button().setId('orbit-view').onClick(update);
    camTransRow.add(orbitView);

    container.add(new UI.HorizontalRule());

    // scene
    var sceneRow = new UI.Row().setId('scene-row');
    container.add(sceneRow);
    sceneRow.add(new UI.Text('Scene background').setFontSize('20px'));

    // scene material
    var sceneBackgroundButtons = [];
    var sceneMatRow = new UI.Row().setMarginLeft('10px');
    sceneRow.add(sceneMatRow);
    
    (function (){
        for (let name in sculptor.sceneBackgroundLib) {
            var bt = new UI.Button().setId(name).onClick(function(){
                updateSceneBackground(name);
            });
            sceneMatRow.add(bt);
            sceneBackgroundButtons.push(bt);
        }
    })();

    container.add(new UI.HorizontalRule());

    // unit
    var unitRow = new UI.Row().setId('unit-row');
    container.add(unitRow);
    unitRow.add(new UI.Text('Unit Material').setFontSize('20px'));

    // unit material
    var unitMatButtons = [];
    var unitMatRow = new UI.Row();
    unitRow.add(unitMatRow);

    (function () {
        for (let name of sculptor.materialNames) {
            var bt = new UI.Button().setId(name).onClick(function(){
                updateUnitMaterial(name);
            });
            unitMatRow.add(bt);
            unitMatButtons.push(bt);
        }
    }) ();

    var uploadTexture = new UI.Texture().setDisplay('none').onChange(function(texture){
        sculptor.materials['custom'].map = uploadTexture.getValue();
        sculptor.materials['custom'].needsUpdate = true;
    });
    uploadTexture.dom.id = 'up-container';
    uploadTexture.dom.children[0].id = 'upload-texture';
    unitMatRow.add(uploadTexture);

    // global material control
    var shaderRow = new UI.Row()//.setId('shader-row');
    container.add(shaderRow);
    // shaderRow.add(new UI.Text('Effect').setFontSize('20px'));
    // wireframe
    shaderRow.add(new UI.Text('wireframe'));
    var wireframe = new UI.Checkbox().onChange(function(){
        let flag = wireframe.getValue();
        if (flag) {
            sculptor.unitMaterial.wireframe = true;
        } else {
            sculptor.unitMaterial.wireframe = false;
        }
    });
    shaderRow.add(wireframe)
    // colored
    shaderRow.add(new UI.Text('colored').setMarginLeft('10px'));
    var colored = new UI.Checkbox().onChange(function(){
        let flag = colored.getValue();
        if (flag) {
            for (let u of sculptor.sculpture.units.children) {
                let m1 = new THREE.MeshStandardMaterial({color:0x33CCFF,/* emissive: 0x464646, */ roughness:1, metalness:0});
                let m2 = new THREE.MeshStandardMaterial({color:0x009966,/* emissive: 0x464646, */ roughness:1, metalness:0});
                let m3 = new THREE.MeshStandardMaterial({color:0xFF6633,/* emissive: 0x464646, */ roughness:1, metalness:0});
                u.sleeve.children[0].material = m1;
                u.accessories.children.map(function(a){a.material = m2});
                u.transmissions.children.map(function(a){a.material = m3});
            }
        } else {
            for (let u of sculptor.sculpture.units.children) {
                u.setMaterial(sculptor.unitMaterial)
            }
        }
    });
    shaderRow.add(colored)

    //
    function updateLayer (layer) {
        var mask = sculptor.camera.layers.mask.toString(2);
        while (mask.length<=sculptor.camLayers) {
            mask = '0'+mask;
        }
        mask = mask.split('').reverse().join('');
        if (mask[layer]==1) {
            sculptor.camera.layers.disable(layer);
        } else if(mask[layer]==0){
            sculptor.camera.layers.enable(layer);
        }
        updateLayerUI();
    }

    function updateLayerUI(){
        var mask = sculptor.camera.layers.mask.toString(2);
        while (mask.length<=sculptor.camLayers) {
            mask = '0'+mask;
        }
        mask = mask.split('').reverse();
        mask.shift();
        mask = mask.join('');
        for (let i=0;i<mask.length;i++) {
            if (mask[i]=='1') {
                layers[i].dom.classList.add('selected');
            } else if (mask[i]=='0') {
                layers[i].dom.classList.remove('selected');
            }
        }
    }

    //
    function updateSceneBackground(name) {
        if (sculptor.scenes.unitScene.background.name == name) {
            return;
        } else {
            sculptor.switchScene(name);
            updateMatUI();
        }
    }

    function updateUnitMaterial (name) {
        
        if (sculptor.unitMaterial.name == name) {
            return;
        } else {
            sculptor.setUnitMaterial( name );
            if (name == 'custom') {
                uploadTexture.setDisplay('');
            } else {
                uploadTexture.setDisplay('none');
            }
            updateMatUI();
        }
    }

    function updateMatUI () {
        // scene material
        for (let b of sceneBackgroundButtons) {
            if (b.dom.id == sculptor.scenes.unitScene.background.name) {
                b.dom.classList.add('selected');
            } else {
                b.dom.classList.remove('selected');
            }
        }
        if (sculptor.scenes.unitScene.background.isColor) {
            sceneBackgroundButtons[0].dom.classList.add('selected');
        } else {
            sceneBackgroundButtons[0].dom.classList.remove('selected');
        }
        // unit material
        for (let b of unitMatButtons) {
            if (b.dom.id == sculptor.unitMaterial.name) {
                b.dom.classList.add('selected');
            } else {
                b.dom.classList.remove('selected');
            }
        }
    }

    function update() {

    }

    updateLayerUI();
    updateMatUI();

    return container;

}