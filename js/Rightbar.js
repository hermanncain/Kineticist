/**
 * @author hermanncain
 */

var Rightbar = function ( sculptor ) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('rightbar');

    // camera
    var cameraRow = new UI.Panel().setId('camera-row');
    container.add(cameraRow);
    cameraRow.add(new UI.Text('Camera').setClass('bar-title'));

    // camera layers
    let layerRow = new UI.Row().setMarginLeft('10px');;
    cameraRow.add(layerRow);
    layerRow.add(new UI.Text('visibility').setWidth('100%'));
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

    // materials

    container.add(new UI.Text('Material').setClass('bar-title'));

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

    // geometry parameters
    var geometryConfig = new Rightbar.Geometry(sculptor);
    container.add( geometryConfig );

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

    signals.objectSelected.add(function(obj){
        
        if (obj instanceof Sketch) {
            geometryConfig.setDisplay( '' );
        } else {
            geometryConfig.setDisplay( 'none' );
        }
        
    });

    return container;

    
}