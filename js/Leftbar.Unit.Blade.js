Leftbar.Unit.Blade = function (sculptor) {

    var signals = sculptor.signals;
    var updateUIOnly = true;

    var container = new UI.Panel().setId('leftbar-unit-blade').add(
        new UI.HorizontalRule(),
        new UI.Text('blade sweeping').setClass('sect-title')
    );
    container.setDisplay('none');

    // sweep controls
    container.add(new UI.Text('◆ width').setClass('param-semantics'));
    var scaleXController = new UI.SplineController(1,8,false,1,1).onDraw(updateSweepingParams);
    container.add(scaleXController);

    container.add(new UI.Text('◆ thickness').setClass('param-semantics'));
    var scaleYController = new UI.SplineController(1,5,false,1,1).onDraw(updateSweepingParams);
    container.add(scaleYController);

    // container.add(new UI.Text('◆ twisting').setClass('param-semantics'));
    // var twistController = new UI.SplineController(1,360,true,0,0,120,40).onDraw(updateSweepingParams);
    // container.add(twistController);

    function updateSweepingParams () {
        
        if (updateUIOnly) return;
        if (sculptor.selectedObjects.length>0) {
            for (let rib of sculptor.selectedObjects) {
                // update controls
                rib.widthControls = scaleXController.getControls();
                rib.thicknessControls = scaleYController.getControls();
                // rib.twistControls = twistController.getControls();

                // update other values
                rib.widths = scaleXController.getValues(rib.sweepSteps);
                rib.thicknesses = scaleYController.getValues(rib.sweepSteps);
                // rib.twists = twistController.getValues(rib.sweepSteps);
            }
        } else {
            let rib = sculptor.selected;
            // update controls
            rib.widthControls = scaleXController.getControls();
            rib.thicknessControls = scaleYController.getControls();
            // rib.twistControls = twistController.getControls();

            // update other values
            rib.widths = scaleXController.getValues(rib.sweepSteps);
            rib.thicknesses = scaleYController.getValues(rib.sweepSteps);
            // rib.twists = twistController.getValues(rib.sweepSteps);
        }
    }

    function updateUI(object) {
        updateUIOnly = true;
        scaleXController.setControls(object.widthControls);
        scaleYController.setControls(object.thicknessControls);
        // twistController.setControls(object.twistControls);
        updateUIOnly = false;
    }

    // event
    signals.objectSelected.add(function(object) {
        if (object) {
            if (object instanceof Rib) {
                container.setDisplay('');
                updateUI(object);
            } else {
                container.setDisplay('none');
            }
        }
        
    });

    return container;

}

    // section shape controls
    // var ellipseH = 0.2;
    // var ellipseW = 0.2;
    // var maxH = 1;
    // var maxW = 1;

    // var ellipseRow = new UI.Row();
    // container.add(ellipseRow);
    // ellipseRow.add(new UI.Text('section shape').setFontSize('16px').setWidth('100%'));

    // // canvas
    // var ellipseCanvas = new UI.Canvas({type:'ellipse',ratio1:ellipseH/maxH,ratio2:ellipseW/maxW},40,40).setDisplay('inline-block');
    // ellipseRow.add(ellipseCanvas);

    // // ellipse axes
    // var ellipseParamRow = new UI.Row().setWidth('103px').setDisplay('inline-block');
    // ellipseParamRow.dom.style.verticalAlign='top';
    // ellipseRow.add(ellipseParamRow);

    // var ellipseARow = new UI.Row().setWidth('120px');
    // ellipseARow.add(new UI.Text('width').setFontSize('14px').setMarginTop('0').setWidth('40px'));
    // var ellipseA = new UI.Number(ellipseW).setRange(0,maxW).onChange(updateSectionShape);
    // ellipseARow.add(ellipseA);
    // ellipseParamRow.add(ellipseARow);

    // var ellipseBRow = new UI.Row().setWidth('120px');
    // ellipseBRow.add(new UI.Text('height').setFontSize('14px').setWidth('40px'));
    // var ellipseB = new UI.Number(ellipseH).setRange(0,maxH).onChange(updateSectionShape);
    // ellipseBRow.add(ellipseB);
    // ellipseParamRow.add(ellipseBRow);

        // function updateSectionShape () {

    //     ellipseW = ellipseA.getValue();
    //     ellipseH = ellipseB.getValue();
    //     sculptor.unit.userData.blade.a = ellipseH;
    //     sculptor.unit.userData.blade.b = ellipseW;

    //     ellipseCanvas.setData({type:'ellipse',ratio1:ellipseW/maxW,ratio2:ellipseH/maxH});

    // }

        // updateSectionShape();
