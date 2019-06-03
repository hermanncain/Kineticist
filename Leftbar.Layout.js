Leftbar.Layout = function (sculptor) {

    var signals = sculptor.signals;
    
    var sizes = [];
    var rZs = [];
    var rXs = [];
    var rYs = [];

    var oldMat = null;
    var newMat = null;

    // ui
    var container = new UI.Panel().setId('leftbar-layout').setDisplay('none');

    // Global parameters
    container.add(new UI.Text('Layout config').setFontSize('20px').setWidth('100%'));

    // number
    var gNumberRow = new UI.Row();
    container.add(gNumberRow);
    gNumberRow.add(new UI.Text('Number'));
    var gNumber = new UI.Integer( 10 ).setRange( 3, 60 ).onChange( update );
    gNumberRow.add(gNumber);

    // scale
    var gScaleRow = new UI.Row();
    container.add(gScaleRow);
    gScaleRow.add(new UI.Text('Scale'));
    var gScale = new UI.Number( 1 ).setPrecision( 2 ).setRange( 0.01, 100 ).onChange( update );
    gScaleRow.add(gScale);

    // torsion
    var gTorsionRow =  new UI.Row();
    container.add(gTorsionRow);
    gTorsionRow.add(new UI.Text('Torsion'));
    var gTorsion = new UI.Number( 0 ).setPrecision( 2 ).setRange( 0.01, 100 ).onChange( update );
    gTorsionRow.add(gTorsion);

    //button
    var genLayout = new UI.Button('layout').onClick(generateLayout);
    container.add(genLayout);
    var genEnv = new UI.Button('wireframe').onClick(genEnvelope);
    container.add(genEnv);

    container.add(new UI.HorizontalRule());

    // Inner transform interpolations
    container.add(new UI.Text('Morph control').setFontSize('20px').setWidth('100%'));

    container.add(new UI.Text('show biases').setWidth('100px'));
    var showBiases = new UI.Checkbox(false).onChange(function(){
        if(showBiases.getValue()) {
            tempChangeMaterial('bias','show');
        } else {
            tempChangeMaterial('bias','hide');            
        }
    });
    container.add(showBiases);

    container.add(new UI.Text('show rotations').setWidth('100px'));
    var showRotations = new UI.Checkbox(false).onChange(function(){
        if(showRotations.getValue()) {
            tempChangeMaterial('rotation','show');
        } else {
            tempChangeMaterial('rotation','hide');            
        }
    });
    container.add(showRotations);

    container.add(new UI.Text('show sizes').setWidth('100px'));
    var showSizes = new UI.Checkbox(false).onChange(function(){
        
        if(showSizes.getValue()) {
            tempChangeMaterial('size','show');
        } else {
            tempChangeMaterial('size','hide');            
        }
    });
    container.add(showSizes);

    container.add(new UI.HorizontalRule());

    container.add(new UI.Text('Mechanism').setFontSize('20px').setWidth('100%'));
    var axisWidthRow = new UI.Row();
    container.add(axisWidthRow);
    axisWidthRow.add(new UI.Text('axis width'));
    var axisWidth = new UI.Number().setRange(0.01,1).onChange(function (){
        if (!sculptor.sculpture) return;
        sculptor.sculpture.axisWidth = axisWidth.getValue();
    });
    axisWidthRow.add(axisWidth);
    var genMech = new UI.Button('solve transmissions').onClick(generateMechanism);
    container.add(genMech);



    function update(){

    }

    function tempChangeMaterial(type,mode) {
        oldMat = sculptor.unit.currentMaterial.clone();
        newMat = oldMat.clone();
        switch(type) {
            case 'size':
                newMat.emissive.setHex(0x000088);
                for (let unit of sculptor.unitMorphKeys.size) {
                    if (mode=='show') {
                        unit.setMaterial(newMat);
                    } else if (mode=='hide') {
                        unit.setMaterial(oldMat);
                    }
                }
            break;
            case 'bias':
                newMat.emissive.setHex(0x880000);
                for (let unit of sculptor.unitMorphKeys.bias) {
                    if (mode=='show') {
                        unit.setMaterial(newMat);
                    } else if (mode=='hide') {
                        unit.setMaterial(oldMat);
                    }
                }
            break;
            case 'rotation':
                newMat.emissive.setHex(0x008800);
                for (let unit of sculptor.unitMorphKeys.rotation) {
                    if (mode=='show') {
                        unit.setMaterial(newMat);
                    } else if (mode=='hide') {
                        unit.setMaterial(oldMat);
                    }
                }
            break;
        }
    }

    function generateLayout(){
        let p = {g:{},l:[]};
        p.g.n = gNumber.getValue();
        p.g.scale = gScale.getValue();
        p.g.torsion = gTorsion.getValue();
        // initialize local morphs
        for (let i=0;i<p.g.n;i++) {
            p.l[i] = {};
        }
        if (!sculptor.sculpture) return;
        sculptor.layout(p);
        // sculptor.resetMorphKeys();
    }

    function generateMechanism() {
        if (sculptor.sculpture.units.children.length==0) {
            alert('please layout first!');
            return;
        }
        signals.infoChanged.dispatch('Searching... please wait a second');
        signals.infoChanged.dispatch(sculptor.sculpture.buildJoints());
        sculptor.sculpture.buildAxis();
    }

    function genEnvelope () {
        if (sculptor.sculpture==undefined) {
            return;
        }
        // sculptor.sculpture.generateEnvelope();
        sculptor.sculpture.buildCurves();
    }

    // get scale factor based on unit size and axis k
    signals.sceneChanged.add(function(name){
        if(name!='layoutScene') return;
        let axis = null;
        for (let obj of sculptor.scenes.layoutScene.children) {
            if (obj.type=='sketch') {
                if (obj.curveType == 'axis') {
                    axis = obj;
                }
            }
        }
        let k = getCurvatureData(axis.curve,200).radius.min*axis.scale.x;
        let r = sculptor.unit.getMaxRadius()*sculptor.unit.scale.x;
        if (r == 0) {
            gScale.setValue(1);
        } else {
            let s = Math.min(0.9*k/r,1);
            gScale.setValue(s);
        }
    });

    signals.sculptureSelected.add(function(sculpture){
        if (!sculpture) return;
        axisWidth.setValue(sculpture.axisWidth);
    });

    // function sort (units) {
    //     units.sort(function(a,b){
    //         if(a.idx<b.idx){
    //             return -1;
    //         }
    //         if(a.idx>b.idx){
    //            return 1;
    //         }
    //         return 0;
    //     });
    // }

    // function interpolateCurve (points,type='linear') {
    //     let curve = new THREE.CurvePath();
    //     if (type == 'spline') {
    //         curve.add(new THREE.SplineCurve(points)); 
    //     } else if (type == 'linear') {
    //         for (let i=0;i<points.length-1;i++) {
    //             curve.add(new THREE.LineCurve(points[i], points[i+1]));
    //         }
    //     }
    //     return curve;
    // }

    return container;

}