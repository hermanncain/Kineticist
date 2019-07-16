Leftbar.Unit.Blade = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit-blade');
    container.setDisplay('none');

    // container.add(new UI.Text('Sweeping'));

    // section shape
    var ellipseRow = new UI.Row();
    container.add(ellipseRow);
    ellipseRow.add(new UI.Text('section shape').setFontSize('16px'))

    // shape params
    var ellipseParamRow = new UI.Row().setWidth('103px').setDisplay('inline-block');
    ellipseParamRow.dom.style.verticalAlign='top';
    var ellipseH = 0.2;
    var ellipseW = 0.2;
    var maxH = 1;
    var maxW = 1;

    var ellipseARow = new UI.Row().setWidth('103px');
    ellipseARow.add(new UI.Text('width').setFontSize('14px'));
    var ellipseA = new UI.Number(ellipseW).setRange(0,maxW).onChange(updateSectionShape);
    ellipseARow.add(ellipseA);
    ellipseParamRow.add(ellipseARow);

    var ellipseBRow = new UI.Row().setWidth('103px');
    ellipseBRow.add(new UI.Text('height').setFontSize('14px'));
    var ellipseB = new UI.Number(ellipseH).setRange(0,maxH).onChange(updateSectionShape);
    ellipseBRow.add(ellipseB);
    ellipseParamRow.add(ellipseBRow);

    // canvas to draw section shape
    var ellipseCanvas = new UI.Canvas({type:'ellipse',ratio1:ellipseH/maxH,ratio2:ellipseW/maxW}).setDisplay('inline-block');
    ellipseRow.add(ellipseCanvas);
    ellipseRow.add(ellipseParamRow);

    // controls
    container.add(new UI.Text('sweeping scale X').setFontSize('16px'));
    var scaleXController = new UI.SplineController(1,5,false,1,1).onDraw(updateSweepingParams);
    container.add(scaleXController);

    container.add(new UI.Text('sweeping scale Y').setFontSize('16px'));
    var scaleYController = new UI.SplineController(1,5,false,1,1).onDraw(updateSweepingParams);
    container.add(scaleYController);

    container.add(new UI.Text('sweeping twisting').setFontSize('16px'));
    var twistController = new UI.SplineController(1,360,true,0,0).onDraw(updateSweepingParams);
    container.add(twistController);

    var seg = 32;

    function updateSectionShape () {

        ellipseW = ellipseA.getValue();
        ellipseH = ellipseB.getValue();
        sculptor.unit.userData.blade.a = ellipseH;
        sculptor.unit.userData.blade.b = ellipseW;

        ellipseCanvas.setData({type:'ellipse',ratio1:ellipseW/maxW,ratio2:ellipseH/maxH});

    }

    function updateSweepingParams () {
        let xs = scaleXController.getValues(seg);
        let ys = scaleYController.getValues(seg);
        let scales = [];
        for (let i=0;i<=seg;i++) {
            scales.push(new THREE.Vector2(xs[i][1],ys[i][1]));
        }
        sculptor.unit.userData.blade.scaleXControls = scaleXController.controlPoints;
        sculptor.unit.userData.blade.scaleYControls = scaleYController.controlPoints;
        sculptor.unit.userData.blade.twistControls = twistController.controlPoints;
        sculptor.unit.userData.blade.scales = scales;
        sculptor.unit.userData.blade.twists = twistController.getValues(seg).map(function(t){return t[1]/180*Math.PI});
    }

    updateSectionShape();
    updateSweepingParams();
    
    return container;

}