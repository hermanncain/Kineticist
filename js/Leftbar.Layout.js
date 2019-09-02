Leftbar.Layout = function (sculptor) {

    var signals = sculptor.signals;
    
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
    var gNumber = new UI.Integer( 10 ).setRange( 3, 60 );
    gNumberRow.add(gNumber);

    // scale
    var gScaleRow = new UI.Row();
    container.add(gScaleRow);
    gScaleRow.add(new UI.Text('Scale'));
    var gScale = new UI.Number( 1 ).setPrecision( 2 ).setRange( 0.01, 100 );
    gScaleRow.add(gScale);

    // torsion
    var gTorsionRow =  new UI.Row();
    container.add(gTorsionRow);
    gTorsionRow.add(new UI.Text('Torsion'));
    var gTorsion = new UI.Number( 0 ).setPrecision( 2 ).setRange( 0.01, 100 );
    gTorsionRow.add(gTorsion);

    // generation
    var generateLayoutButton = new UI.Button().setId('layout').onClick(generateLayout);
    container.add(generateLayoutButton);
    var clearLayoutButton = new UI.Button().setId('clear-layout').onClick(function () {
        sculptor.sculpture.clear();
    });
    container.add(clearLayoutButton);

    container.add(new UI.HorizontalRule());


    // show morph controls

    container.add(new UI.Text('Morph controls').setFontSize('20px').setWidth('100%'));
    var morphControlRow = new UI.Row().setMarginLeft('10px');
    container.add(morphControlRow);
    let currentMorph = '';
    let morphMaps = {'T':'bias','R':'rotation','S':'size'};
    let morphOpButtons = [];
    (function () {
        for (let op in morphMaps) {
            var bt = new UI.Button(op).onClick(function(){
                showMorphControls(op);
            });
            morphControlRow.add(bt);
            morphOpButtons.push(bt);
        }
    })();

    var morphTrans = Leftbar.MorphTransforms(sculptor);
    container.add(morphTrans);

    function showMorphControls(op) {
        // reset materials
        for (let key in sculptor.unitMorphKeys) {
            sculptor.showKeys = false;
            for (let u of sculptor.unitMorphKeys[key]) {
                u.setMaterial(sculptor.currentMaterial);
            }
        }
        
        // set material
        if (op != currentMorph) {
            sculptor.showKeys = true;
            getLabeledMaterial(op);
            for (let unit of sculptor.unitMorphKeys[morphMaps[op]]) {
                unit.setMaterial(labeledMaterial);
            }
        }
        updateMorphUI(op);
    }

    function updateMorphUI (op) {
        if (currentMorph == op) {
            // deselect
            for (let bt of morphOpButtons) {
                if (bt.dom.textContent == op) {
                    currentMorph = '';
                    bt.dom.classList.remove('selected');
                    return;
                }
            }
        } else {
            // select
            for (let bt of morphOpButtons) {
                if (bt.dom.textContent == op) {
                    currentMorph = op;
                    bt.dom.classList.add('selected');
                } else {
                    bt.dom.classList.remove('selected');
                }
            }
        }
    }

    container.add(new UI.HorizontalRule());

    container.add(new UI.Text('Mechanism').setFontSize('20px').setWidth('100%'));
    // var axisWidthRow = new UI.Row();
    // container.add(axisWidthRow);
    // axisWidthRow.add(new UI.Text('axis width'));
    // var axisWidth = new UI.Number().setRange(0.01,1).onChange(function (){
    //     if (!sculptor.sculpture) return;
    //     sculptor.sculpture.axisWidth = axisWidth.getValue();
    // });
    // axisWidthRow.add(axisWidth);
    var genMech = new UI.Button('solve transmissions').onClick(generateMechanism);
    container.add(genMech);

    var genUnits = new UI.Button('generate units').onClick(generateUnits);
    container.add(genUnits);

    function generateLayout(){
        let params = {
            n: gNumber.getValue(),
            scale: gScale.getValue(),
            torsion: gTorsion.getValue(),
        };
        if (!sculptor.sculpture) return;
        sculptor.layout(params);
        signals.sculptureChanged.dispatch();
        // sculptor.resetMorphKeys();
    }

    function generateMechanism() {
        if (sculptor.sculpture.units.children.length==0) {
            alert('please layout first!');
            return;
        }
        if (sculptor.sculpture.buildJoints(true)) {
            signals.infoChanged.dispatch('Got a feasible solution.');
            // TODO: determine junction phases

            sculptor.sculpture.buildAxis();
            sculptor.sculpture.buildBearings();
        } else {
            signals.infoChanged.dispatch('Failed, please modify axis shape near highlighted units, or densify units');
        }
    }

    function generateUnits () {
        let sculpture = sculptor.sculpture;
        for (let u of sculpture.units.children) {
            u.userData.decs.has = true;
            u.userData.decs.positions = [1];
            u.userData.decs.scales = [0.5];
            u.userData.decs.shapes = ['0'];
            u.userData.blade.a = 0.05;
            u.userData.blade.b = 0.05;
            u.generateShape();
        }
        sculpture.buildAxis();
    }

    // get scale factor based on unit size and axis k
    signals.sceneChanged.add(function(name){
        if(name!='layoutScene'||sculptor.unit.skeleton.children.length==0||!sculptor.axis) return;
        let k = getCurvatureData(sculptor.axis.curve,200).radius.min*sculptor.axis.scale.x;
        let r = sculptor.unit.getMaxRadius()*sculptor.unit.scale.x;
        if (r == 0) {
            gScale.setValue(1);
        } else {
            let s = Math.min(0.9*k/r,1);
            gScale.setValue(s);
        }
    });

    return container;

}