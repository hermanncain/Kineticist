Leftbar.Sculpture.Layout = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('layouts').setMargin('0').setPadding('0');

    // title bar
    var layoutTitleContainer = new UI.Panel().setWidth('100%').setHeight('43px').setMargin('0').setPadding('0').setBackground('#ddd');
    container.add(layoutTitleContainer);
    var generateLayoutButton = new UI.Button().setId('layout').onClick(generateLayout);
    var clearLayoutButton = new UI.Button().setId('clear-layout').onClick(function () {
        sculptor.sculpture.clear();
    });
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

    // handler
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

    signals.unitScaleChanged.add(function(name){
        // if(name!='layoutScene'||sculptor.unit.skeleton.children.length==0||!sculptor.axis) return;
        // restore
        if (sculptor.sculpture.params) {
            gNumber.setValue(sculptor.sculpture.params.n);
            gScale.setValue(sculptor.sculpture.params.scale);
            gTorsion.setValue(sculptor.sculpture.params.torsion);
            return;
        }
        // new
        let k = getCurvatureData(sculptor.sculpture.axis.curve,200).radius.min*sculptor.sculpture.axis.scale.x;
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