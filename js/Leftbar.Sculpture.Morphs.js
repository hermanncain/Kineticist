Leftbar.Sculpture.Morphs = function (sculptor) {
    var signals = sculptor.signals;

    let morphMaps = {'T':'bias','R':'rotation','S':'size'};

    var container = new UI.Panel().setId('morphs').setMargin('0').setPadding('0');
    container.add(
        new UI.Text('Morph').setClass('bar-title')
    );
    var morphContent = new UI.Panel().setClass('content');
    container.add(morphContent);

    // 0. interpolation method
    let intMethods = ['linear','cubic'];
    let intMethod = new UI.Select().setWidth('90px').setMarginLeft('10px');
    morphContent.add(
        new UI.Text('Interpolation method').setClass('sect-title'),
        intMethod
    );
    intMethod.setOptions(intMethods);
    intMethod.setValue(0);
    
    // 1. Morph controls
    morphContent.add(
        new UI.Text('Morph mode').setClass('sect-title')
    );

    // show/hide morph controls
    let tRadio = new UI.Radio(false,'T');
    let rRadio = new UI.Radio(false,'R');
    let sRadio = new UI.Radio(false,'S');
    let radios = [tRadio,rRadio,sRadio];
    morphContent.add(
        new UI.Row().add(
            tRadio,
            new UI.Text('translation morph').setClass('param').setColor('red')
        ).onClick(function(){
            showMorphControls('T');
        }),
        new UI.Row().add(
            rRadio,
            new UI.Text('rotation morph').setClass('param').setColor('green')
        ).onClick(function(){
            showMorphControls('R');
        }),
        new UI.Row().add(
            sRadio,
            new UI.Text('scale morph').setClass('param').setColor('blue')
        ).onClick(function(){
            showMorphControls('S');
        })
    );

    // 2. Morph settings
    var morphSettingRow = new UI.Panel().setClass('content').setDisplay('none');
    morphContent.add(morphSettingRow);
    // set/unset as the morph control unit
    var setControlRow = new UI.Row();
    morphSettingRow.add(setControlRow);
    let setControl = new UI.Checkbox().onChange(function(){
        if (setControl.getValue()) {
            addKey(morphMaps[sculptor.currentMorph]);
        } else {
            removeKey(morphMaps[sculptor.currentMorph]);
        }
    });
    setControlRow.add(
        new UI.Text('set as control').setClass('param'),
        setControl
    );

    // edit morph params
    biasValueRow = new UI.Row().setDisplay('none');
    morphSettingRow.add(biasValueRow);
    var xBias = new UI.Number().onChange(updateSculpture);
    biasValueRow.add(
        new UI.Text('radial X T').setClass('param').setWidth('50%'),
        xBias
    );
    var yBias = new UI.Number().onChange(updateSculpture);
    biasValueRow.add(
        new UI.Text('radial Y T').setClass('param').setWidth('50%'),
        yBias
    );
    var zBias = new UI.Number().onChange(updateSculpture);
    biasValueRow.add(
        new UI.Text('axial T').setClass('param').setWidth('50%'),
        zBias
    );

    rotationValueRow = new UI.Row().setDisplay('none');
    morphSettingRow.add(rotationValueRow);
    var xRotation = new UI.Number().setRange(-30,30).onChange(updateSculpture);
    rotationValueRow.add(
        new UI.Text('radial X R').setClass('param').setWidth('50%'),
        xRotation
    );
    var yRotation = new UI.Number().setRange(-30,30).onChange(updateSculpture);
    rotationValueRow.add(
        new UI.Text('radial Y R').setClass('param').setWidth('50%'),
        yRotation
    );
    var zRotation = new UI.Number().onChange(updateSculpture);
    rotationValueRow.add(
        new UI.Text('axial R').setClass('param').setWidth('50%'),
        zRotation
    );

    sizeValueRow = new UI.Row().setDisplay('none');
    morphSettingRow.add(sizeValueRow);
    var xSize = new UI.Number().onChange(updateSculpture);
    sizeValueRow.add(
        new UI.Text('radial X S').setClass('param').setWidth('50%'),
        xSize
    );
    var ySize = new UI.Number().onChange(updateSculpture);
    sizeValueRow.add(
        new UI.Text('radial Y S').setClass('param').setWidth('50%'),
        ySize
    );

    let morphRowValueMap = {'bias':biasValueRow,'rotation':rotationValueRow,'size':sizeValueRow};
    let updateMorphUIMap = {'bias':updateBiasUI,'rotation':updateRotationUI,'size':updateSizeUI};
    let morphResetMap = {'bias':[0,0,0],'rotation':[0,0,0],'size':[1,1,1]};

    // handler
    function showMorphControls(op) {
        sculptor.select(null);
        // reset materials
        sculptor.showKeys = false;
        for (let key in sculptor.unitMorphKeys) {
            for (let u of sculptor.unitMorphKeys[key]) {
                u.setMaterial(sculptor.currentMaterial);
            }
        }
        
        // set material
        if (op != sculptor.currentMorph) {
            sculptor.showKeys = true;
            getLabeledMaterial(op);
            for (let unit of sculptor.unitMorphKeys[morphMaps[op]]) {
                unit.setMaterial(labeledMaterial);
            }
        }
        updateMorphControlUI(op);
    }

    function updateMorphControlUI (op) {
        if (sculptor.currentMorph == op) {
            // deselect
            for (let radio of radios) {
                if (radio.label == op) {
                    sculptor.currentMorph = '';
                    radio.setValue(false);
                    return;
                }
            }
        } else {
            // select
            for (let radio of radios) {
                if (radio.label == op) {
                    sculptor.currentMorph = op;
                    radio.setValue(true);
                } else {
                    radio.setValue(false);
                }
            }
        }
        // morphTrans.showMorphs(op);
    }
    function updateBiasUI(unit) {
        xBias.setValue(unit.userData.morphTrans.bias[0]);
        yBias.setValue(unit.userData.morphTrans.bias[1]);
        zBias.setValue(unit.userData.morphTrans.bias[2]);
        if (sculptor.currentMorph == 'T') {
            biasValueRow.setDisplay('');
        } else {
            biasValueRow.setDisplay('none');
        }
    }
    function updateRotationUI(unit) {
        xRotation.setValue(unit.userData.morphTrans.rotation[0]/Math.PI*180);
        yRotation.setValue(unit.userData.morphTrans.rotation[1]/Math.PI*180);
        zRotation.setValue(unit.userData.morphTrans.rotation[2]/Math.PI*180);
        if (sculptor.currentMorph == 'R') {
            rotationValueRow.setDisplay('');
        } else {
            rotationValueRow.setDisplay('none');
        }
    }
    function updateSizeUI(unit) {
        xSize.setValue(unit.userData.morphTrans.size[0]);
        ySize.setValue(unit.userData.morphTrans.size[1]);
        // zSize.setValue(unit.userData.morphTrans.size[2]);
        if (sculptor.currentMorph == 'S') {
            sizeValueRow.setDisplay('');
        } else {
            sizeValueRow.setDisplay('none');
        }
    }

    function addKey (key) {
        if (!(sculptor.selected instanceof Unit)) {
            return;
        }
        // avoid repeating adding
        if (sculptor.unitMorphKeys[key].indexOf(sculptor.selected)>=0) {
            return;
        }
        sculptor.unitMorphKeys[key].push(sculptor.selected);
        sort(sculptor.unitMorphKeys[key]);
        sculptor.selected.setMaterial(labeledMaterial);
        updateMorphUIMap[key](sculptor.selected);
        signals.setMorphControl.dispatch(key);
    }

    function removeKey (key) {
        if (sculptor.unitMorphKeys[key].indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(sculptor.currentMaterial);
            sculptor.unitMorphKeys[key].splice(sculptor.unitMorphKeys[key].indexOf(sculptor.selected),1);
            morphRowValueMap[key].setDisplay('none');
            sculptor.selected.userData.morphTrans[key] = morphResetMap[key];
            updateSculpture(key);
            signals.removeMorphControl.dispatch();
        }        
    }
    function updateSculpture () {
        if (!(sculptor.selected instanceof Unit)) return;
        let value = null;
        let key = morphMaps[sculptor.currentMorph];
        switch (key) {
            case 'bias':
                value = [xBias.getValue(),yBias.getValue(),zBias.getValue()];
            break;
            case 'rotation':
                value = [xRotation.getValue()*Math.PI/180,yRotation.getValue()*Math.PI/180,zRotation.getValue()*Math.PI/180];
            break;
            case 'size':
                value = [xSize.getValue(),ySize.getValue(),1];
            break;
        }
        sculptor.selected.userData.morphTrans[key] = value;
        let idx = sculptor.unitMorphKeys[key].map(function(u){return sculptor.sculpture.units.children.indexOf(u)});
        for (let i = 0;i<sculptor.sculpture.units.children.length;i++) {
            let ns=[];
            for (let j=0;j<3;j++) {
                let s = sculptor.unitMorphKeys[key].map(function(u){return u.userData.morphTrans[key][j]});
                let linearInt = intMethod.getValue() == 0;
                let itp = linearInt? new THREE.LinearInterpolant(idx,s,1):new THREE.CubicInterpolant(idx,s,1);
                ns.push(itp.evaluate(i)[0]);
            }
            sculptor.sculpture.units.children[i][morphOpMap[key]](ns[0],ns[1],ns[2]);
            sculptor.sculpture.units.children[i].generateShape();
        }
        
    }

    function sort (units) {
        units.sort(function(a,b){
            if(a.idx<b.idx){
                return -1;
            }
            if(a.idx>b.idx){
               return 1;
            }
            return 0;
        });
    }

    // subscriber
    signals.objectSelected.add(function(obj){
        // non-unit will not show morph controls
        if (!(obj instanceof Unit)||sculptor.currentMorph=='') {
            morphSettingRow.setDisplay('none');
            return;
        } else {
            morphSettingRow.setDisplay('');
        }
        let key = morphMaps[sculptor.currentMorph];
        let controls = sculptor.unitMorphKeys[key];
        let controlIdx = controls.indexOf(obj);
        let units = sculptor.sculpture.units.children;
        let unitIdx = units.indexOf(obj);
        // selected unit is not a control unit of the current morph key
        // set the 'set as control' checkbox in morphsettingrow as unchecked
        if (controlIdx < 0) {
            setControl.setValue(false);
            setControl.dom.disabled = false;
            // hide all 3 kinds of morph values
            for (k in morphMaps) {
                morphRowValueMap[morphMaps[k]].setDisplay('none');
            }
        } else {
            // selected unit is a control unit in the current morph key
            // enable the 'set as control' checkbox in morphsettingrow
            // and set it as checked 
            setControl.setValue(true);
            updateMorphUIMap[key](obj);
            if (unitIdx ==0 || unitIdx == units.length-1) {
                setControl.dom.disabled = true;
            } else {
                setControl.dom.disabled = false;
            }
            for (k in morphRowValueMap) {
                if (key == k) {
                    morphRowValueMap[k].setDisplay('');
                } else {
                    morphRowValueMap[k].setDisplay('none');
                }
            }
        }
    });

    signals.unitMorphed.add(function(u){
        // let key = morphMaps[sculptor.currentMorph];
        let t = u.userData.morphTrans.bias;
        let r = u.userData.morphTrans.rotation;
        let s = u.userData.morphTrans.size;
        switch(sculptor.currentMorph) {
            case 'T':
                xBias.setValue(t[0]);
                yBias.setValue(t[1]);
                zBias.setValue(t[2]);
            break;
            case 'R':
                xRotation.setValue(r[0]);
                yRotation.setValue(r[1]);
                zRotation.setValue(r[2]);
            break;
            case 'S':
                xSize.setValue(s[0]);
                ySize.setValue(s[1]);
            break;
        }
        updateSculpture();
    });

    return container;
}