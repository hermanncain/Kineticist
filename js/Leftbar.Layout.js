Leftbar.Layout = function (sculptor) {

    var signals = sculptor.signals;
    
    var oldMat = null;
    var newMat = null;

    var container = new UI.Panel().setId('leftbar-layout').setDisplay('none')

    // 1. Layout
    // layout/cancel buttons
    var generateLayoutButton = new UI.Button().setId('layout').onClick(generateLayout);
    var clearLayoutButton = new UI.Button().setId('clear-layout').onClick(function () {
        sculptor.sculpture.clear();
    });

    var layoutTitleContainer = new UI.Panel().setWidth('100%').setHeight('43px').setMargin('0').setPadding('0').setBackground('#ddd');
    container.add(layoutTitleContainer);
    layoutTitleContainer.add(
        new UI.Text('Layout').setClass('bar-title').setWidth('70px'),
        generateLayoutButton,
        clearLayoutButton,
    );

    // layout params
    var layoutContent = new UI.Panel().setClass('content');
    container.add(layoutContent);

    // number
    var gNumberRow = new UI.Row();
    layoutContent.add(gNumberRow);
    gNumberRow.add(new UI.Text('number').setClass('param-semantics'));
    var gNumber = new UI.Integer( 10 ).setRange( 3, 60 );
    gNumberRow.add(gNumber);

    // scale
    var gScaleRow = new UI.Row();
    layoutContent.add(gScaleRow);
    gScaleRow.add(new UI.Text('scale').setClass('param-semantics'));
    var gScale = new UI.Number( 1 ).setPrecision( 2 ).setRange( 0.01, 100 );
    gScaleRow.add(gScale);

    // torsion
    var gTorsionRow =  new UI.Row();
    layoutContent.add(gTorsionRow);
    gTorsionRow.add(new UI.Text('torsion').setClass('param-semantics'));
    var gTorsion = new UI.Number( 0 ).setPrecision( 2 ).setRange( -100, 100 );
    gTorsionRow.add(gTorsion);

    // 2. Morphing
    var morphs = new Leftbar.Morphs(sculptor);
    container.add(morphs);

    // 3. Mechanism solving
    var mechContent = new UI.Panel().setClass('content');
    var solveTrans = new UI.Button().setId('solve-transmissions').onClick(generateTransmissions);
    // mechContent.add(genMech);
    container.add(
        new UI.Text('Mechanism').setClass('bar-title'),
        mechContent.add(
            new UI.Text('solve transmissions').setClass('param').setWidth('90px').setMarginRight('20px'),
            solveTrans
        )
    );
    // mech params
    let axisDiameter = new UI.Number(10).setRange(5,20).setPrecision(0.1).setMarginLeft('5px');
    let genMech = new UI.Button('generate mechanisms').setWidth('150px').onClick(function() {
        sculptor.sculpture.axisWidth = axisDiameter.getValue()/200;
        sculptor.sculpture.buildAxis();
        sculptor.sculpture.buildBearings();
    });
    mechContent.add(
        new UI.Text('axis diameter (mm)').setClass('param').setWidth('100px'),
        axisDiameter,
        // new UI.Panel(),
        // new UI.Text('mechanism').setClass('param'),
        genMech
    )
    // export .stl files
    let expSTL = new UI.Button('export stl').setWidth('150px').onClick(function() {
        var ks = sculptor.sculpture.clone();        
        for (let u of ks.units.children) {
            if (u.rod) {
                u.rod.clearEnvelope();
            }
            if (u.fork) {
                u.fork.clearEnvelope();
            }
        }
        var result = exporter.parse( ks );
        saveString( result, 'sculpture.stl' );
    });
    mechContent.add(expSTL);
    // var axisWidthRow = new UI.Row();
    // container.add(axisWidthRow);
    // axisWidthRow.add(new UI.Text('axis width'));
    // var axisWidth = new UI.Number().setRange(0.01,1).onChange(function (){
    //     if (!sculptor.sculpture) return;
    //     sculptor.sculpture.axisWidth = axisWidth.getValue();
    // });
    // axisWidthRow.add(axisWidth);
    // var solveRow = new UI.Row();

    
    // disable for review
    var genUnits = new UI.Button('generate units').onClick(generateUnits);
    // mechContent.add(genUnits);

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

    function generateTransmissions() {
        if (sculptor.sculpture.units.children.length==0) {
            alert('please layout first!');
            return;
        }
        if (sculptor.sculpture.buildJoints(true)) {
            signals.infoChanged.dispatch('Got a feasible solution.');
            // TODO: determine junction phases
            // sculptor.sculpture.buildAxis();
            // sculptor.sculpture.buildBearings();
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