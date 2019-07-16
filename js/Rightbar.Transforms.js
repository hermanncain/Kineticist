Rightbar.Transforms = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('rightbar-transforms');
    
    var selectedName = new UI.Text().setFontSize('20px');
    container.add(selectedName);

    container.add(new UI.Text('Object Transforms').setFontSize('20px')/* .setMargin('5px') */);
    // position

    var objectPositionRow = new UI.Row();
    var objectPositionX = new UI.Number().setWidth( '35px' ).setPrecision( 2 ).onChange( update );
    var objectPositionY = new UI.Number().setWidth( '35px' ).setPrecision( 2 ).onChange( update );
    var objectPositionZ = new UI.Number().setWidth( '35px' ).setPrecision( 2 ).onChange( update );

    objectPositionRow.add( new UI.Text( 'position' ).setWidth( '55px' ) );
    objectPositionRow.add( objectPositionX, objectPositionY, objectPositionZ );

    container.add( objectPositionRow );

    // rotation

    var objectRotationRow = new UI.Row();
    var objectRotationX = new UI.Number().setWidth( '35px' ).setStep( 10 ).setUnit( '°' ).onChange( update );
    var objectRotationY = new UI.Number().setWidth( '35px' ).setStep( 10 ).setUnit( '°' ).onChange( update );
    var objectRotationZ = new UI.Number().setWidth( '35px' ).setStep( 10 ).setUnit( '°' ).onChange( update );

    objectRotationRow.add( new UI.Text( 'rotation' ).setWidth( '55px' ) );
    objectRotationRow.add( objectRotationX, objectRotationY, objectRotationZ );

    container.add( objectRotationRow );

    // scale

    var objectScaleRow = new UI.Row();
    var objectScaleX = new UI.Number( 1 ).setWidth( '35px' ).setPrecision( 2 ).setRange( 0.001, Infinity ).onChange( update );
    var objectScaleY = new UI.Number( 1 ).setWidth( '35px' ).setPrecision( 2 ).setRange( 0.001, Infinity ).onChange( update );
    var objectScaleZ = new UI.Number( 1 ).setWidth( '35px' ).setPrecision( 2 ).setRange( 0.001, Infinity ).onChange( update );

    objectScaleRow.add( new UI.Text( 'scale' ).setWidth( '55px' ) );
    objectScaleRow.add( objectScaleX, objectScaleY, objectScaleZ );

    container.add( objectScaleRow );

    container.add( new UI.HorizontalRule() );

    // var morphTrans = Rightbar.MorphTransforms(sculptor);
    // container.add(morphTrans);

    var singleOp = new UI.Panel();
    container.add(singleOp);
    // servo cylindircal coords
    singleOp.add(new UI.Text('Cylindrical RCS').setFontSize('16px').setMargin('5px'));
    var cylindricals = new UI.Row();
    singleOp.add(cylindricals);
    cylindricals.add(new UI.Text('r').setMargin('5px').setMarginLeft('25px').setMarginRight('25px'));
    cylindricals.add(new UI.Text('t').setMargin('5px').setMarginLeft('25px').setMarginRight('25px'));
    cylindricals.add(new UI.Text('h').setMargin('5px').setMarginLeft('25px').setMarginRight('25px'));
    var rth = new UI.Row();
    singleOp.add(rth);
    var p2 = new UI.Number(0).setMarginLeft('15px').onChange(updateRib);
    rth.add(p2);
    var p3 = new UI.Number(0).setMarginLeft('15px').onChange(updateRib);
    rth.add(p3);
    var p4 = new UI.Number(0).setMarginLeft('15px').onChange(updateRib);
    rth.add(p4);

    singleOp.add( new UI.HorizontalRule() );

    // servo euclidean coords
    singleOp.add(new UI.Text('Cartesian RCS').setFontSize('16px').setMargin('5px'));
    var seuclidean = new UI.Row();
    singleOp.add(seuclidean);
    seuclidean.add(new UI.Text('R').setFontSize('15px').setMargin('5px').setMarginLeft('24px').setMarginRight('24px'));
    let seTTitle = new UI.Text('T').setFontSize('15px').setMargin('5px').setMarginLeft('24px').setMarginRight('24px')
    seuclidean.add(seTTitle);
    seuclidean.add(new UI.Text('Z').setFontSize('15px').setMargin('5px').setMarginLeft('24px').setMarginRight('24px'));
    var rtz = new UI.Row();
    singleOp.add(rtz);
    var seR = new UI.Number(0).setMarginLeft('15px').onChange(updateServoEuclidean);
    rtz.add(seR);
    var seT = new UI.Number(0).setMarginLeft('15px').onChange(updateServoEuclidean);
    rtz.add(seT);
    var seZ = new UI.Number(0).setMarginLeft('15px').onChange(updateServoEuclidean);
    rtz.add(seZ);

    function update(){
        let object = sculptor.selected;
        if (object==null) return;
        object.position.set(objectPositionX.getValue(),objectPositionY.getValue(),objectPositionZ.getValue());
        object.rotation.set(objectRotationX.getValue(),objectRotationY.getValue(),objectRotationZ.getValue());
        object.scale.set(objectScaleX.getValue(),objectScaleY.getValue(),objectScaleZ.getValue());
    }

    function updateUI(obj) {
        if (!obj) return;
        objectPositionX.setValue(obj.position.x);
        objectPositionY.setValue(obj.position.y);
        objectPositionZ.setValue(obj.position.z);
        objectRotationX.setValue(obj.rotation.x);
        objectRotationY.setValue(obj.rotation.y);
        objectRotationZ.setValue(obj.rotation.z);
        objectScaleX.setValue(obj.scale.x);
        objectScaleY.setValue(obj.scale.y);
        objectScaleZ.setValue(obj.scale.z);
    }
    function updateCynlidricalUI(object) {
        let rib = object.parent.parent;
        let c = rib.getServoCylindrical(object);
        p2.setValue(c.r);
        p3.setValue(c.t/Math.PI*180);
        p4.setValue(c.h);
    }

    function updateServoEuclideanUI(object) {
        let rib = object.parent.parent;
        let se = rib.unitToRib(object.position);
        if (object.name=='vp') {
            seTTitle.setDisplay('none');
            seT.setDisplay('none');
        } else {
            seTTitle.setDisplay('');
            seT.setDisplay('');
        }
        seR.setValue(se.x);
        seT.setValue(se.y);
        seZ.setValue(se.z);
    }

    signals.objectSelected.add(function(obj){
        container.setDisplay('');
        if (!obj) {
            container.setDisplay('none');
            return;
        } else if (obj.name=='vp'||obj.name == 'ribpoint'){
            objectPositionRow.setDisplay('');
            objectRotationRow.setDisplay('none');
            objectScaleRow.setDisplay('none');
            singleOp.setDisplay('');
            // morphTrans.setDisplay('none');
            updateCynlidricalUI(obj);
            updateServoEuclideanUI(obj);
        } else if (obj instanceof Rib) {
            objectPositionRow.setDisplay('none');
            objectRotationRow.setDisplay('');
            objectScaleRow.setDisplay('');
            singleOp.setDisplay('none');
            // morphTrans.setDisplay('none');
        } else if (obj instanceof Unit) {
            objectPositionRow.setDisplay('none');
            objectRotationRow.setDisplay('');
            objectScaleRow.setDisplay('');
            singleOp.setDisplay('none');
            // morphTrans.setDisplay('');
        } else if (obj.name == 'control point') {
            objectPositionRow.setDisplay('');
            objectRotationRow.setDisplay('none');
            objectScaleRow.setDisplay('none');
            singleOp.setDisplay('none');
            // morphTrans.setDisplay('none');
        } else if (obj.parent instanceof Sketch) {
            objectPositionRow.setDisplay('');
            objectRotationRow.setDisplay('');
            objectScaleRow.setDisplay('');
            singleOp.setDisplay('none');
            // morphTrans.setDisplay('none');
        }
        selectedName.setValue(obj.name);
    });

    signals.objectTransformed.add(function(obj){
        if (!obj) return;
        updateUI(obj);
        if (obj.name == 'ribpoint'||obj.name == 'vp') {
            updateCynlidricalUI(obj);
            updateServoEuclideanUI(obj);
        }
    });
    function updateRib() {
        if (sculptor.selected) {
            if(sculptor.selected.name == 'ribpoint'||sculptor.selected.name == 'vp') {
                let rib = sculptor.selected.parent.parent;
                let r = p2.getValue();
                let t = p3.getValue()/180*Math.PI;
                let h = p4.getValue();
                let c = {r:r,t:t,h:h};
                rib.setServoCylindrical(sculptor.selected,c);
                signals.objectTransformed.dispatch(sculptor.selected);
            }
        }
    }

    function updateServoEuclidean(){
        if (sculptor.selected) {
            if(sculptor.selected.name == 'ribpoint'||sculptor.selected.name == 'vp') {
                let rib = sculptor.selected.parent.parent;
                let r = seR.getValue();
                let t = seT.getValue();
                let z = seZ.getValue();
                rib.updatePointFromRib(sculptor.selected.position,new THREE.Vector3(r,t,z));
                signals.objectTransformed.dispatch(sculptor.selected);
            }
        }
    }

        return container;
}