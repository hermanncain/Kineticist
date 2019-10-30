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
    // cameraRow.add(camTransRow);
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

    // materials

    container.add(new UI.Text('Material').setFontSize('20px'));

    // scene
    var sceneRow = new UI.Row().setId('scene-row');
    container.add(sceneRow);
    sceneRow.add(new UI.Text('Scene').setMargin('10px'));

    // scene material
    var sceneBackgroundButtons = [];
    var sceneMatRow = new UI.Row().setMarginLeft('10px');
    sceneRow.add(sceneMatRow);
    
    (function (){
        for (let name in backgrounds) {
            var bt = new UI.Button().setId(name).onClick(function(){
                updateSceneBackground(name);
            });
            sceneMatRow.add(bt);
            sceneBackgroundButtons.push(bt);
        }
    })();

    // unit material
    var unitRow = new UI.Row().setId('unit-row');
    container.add(unitRow);
    unitRow.add(new UI.Text('Unit').setMargin('10px'));

    var unitMaterial = new UI.Select().setWidth('80px').setMarginLeft('20px').onChange(function(){
        let mat = unitMaterial.getValue();
        switch (mat) {
            case '0':
                sculptor.setMaterial(grayMaterial);
            break;
            case '1':
                sculptor.setMaterial(metalMaterial);
            break;
            case '2':
                sculptor.setMaterial('color');
            break;
        }
    });
    unitRow.add(unitMaterial);
    unitMaterial.setMultiple = false;
    unitMaterial.setOptions(['gray','metal','colored']);
    unitMaterial.setValue(0);
    
    // debug
    var debugRow = new UI.Row();
    // container.add(debugRow);
    // show single unit
    var isShowingSingle = false;
    let showSingle = new UI.Button('single').onClick(function(){
        let s = sculptor.sculpture;
        let n = s.units.children.length;
        if (!isShowingSingle) {
            for (let i=0;i<n;i++) {
                if (i != 3) {
                    s.units.children[i].visible = false;
                }
            }
            isShowingSingle = true;
        } else {
            s.units.children.map(function(u){
                u.visible = true;
            });
            isShowingSingle = false;
        }
    });
    debugRow.add(showSingle);
    // show two neighbor units
    var isShowingPair = false;
    let showPair = new UI.Button('pair').onClick(function(){
        let s = sculptor.sculpture;
        let n = s.units.children.length;
        if (!isShowingPair) {
            for (let i=0;i<n;i++) {
                if (i != 3 && i != 4) {
                    s.units.children[i].visible = false;
                }
            }
            isShowingPair = true;
        } else {
            s.units.children.map(function(u){
                u.visible = true;
            });
            isShowingPair = false;
        }
    });
    debugRow.add(showPair);
    // hide all units
    var isHidingUnits = false;
    let hideUnits = new UI.Button('hide').onClick(function(){
        let s = sculptor.sculpture.units.children;
        if (!isHidingUnits) {
            s.map(function(u){
                u.visible = false;
            });
            isHidingUnits = true;
        } else {
            s.map(function(u){
                u.visible = true;
            });
            isHidingUnits = false;
        }
    });
    debugRow.add(hideUnits);

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

    function updateSceneBackground(name) {
        if (sculptor.unitScene.background.name == name) {
            return;
        } else {
            sculptor.changeScene(name);
            updateMatUI();
        }
    }

    function updateMatUI () {
        for (let b of sceneBackgroundButtons) {
            if (b.dom.id == sculptor.unitScene.background.name) {
                b.dom.classList.add('selected');
            } else {
                b.dom.classList.remove('selected');
            }
        }
        if (sculptor.unitScene.background.isColor) {
            sceneBackgroundButtons[0].dom.classList.add('selected');
        } else {
            sceneBackgroundButtons[0].dom.classList.remove('selected');
        }
    }

    function update() {

    }

    updateLayerUI();
    updateMatUI();
    updateLayer(5);

    return container;

}