Leftbar.Morphs = function (sculptor) {
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
    biasValueRow.add(xBias);
    var yBias = new UI.Number().onChange(updateSculpture);
    biasValueRow.add(yBias);
    var zBias = new UI.Number().onChange(updateSculpture);
    biasValueRow.add(zBias);

    rotationValueRow = new UI.Row().setDisplay('none');
    morphSettingRow.add(rotationValueRow);
    var xRotation = new UI.Number().setRange(-30,30).onChange(updateSculpture);
    rotationValueRow.add(xRotation);
    var yRotation = new UI.Number().setRange(-30,30).onChange(updateSculpture);
    rotationValueRow.add(yRotation);
    var zRotation = new UI.Number().onChange(updateSculpture);
    rotationValueRow.add(zRotation);

    sizeValueRow = new UI.Row().setDisplay('none');
    morphSettingRow.add(sizeValueRow);
    var xSize = new UI.Number().onChange(updateSculpture);
    sizeValueRow.add(xSize);
    var ySize = new UI.Number().onChange(updateSculpture);
    sizeValueRow.add(ySize);

    let morphRowValueMap = {'bias':biasValueRow,'rotation':rotationValueRow,'size':sizeValueRow};
    let updateMorphUIMap = {'bias':updateBiasUI,'rotation':updateRotationUI,'size':updateSizeUI};
    let morphOpMap = {'bias':'setMorphTranslation','rotation':'setMorphRotation','size':'setMorphScale'};
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
        sculptor.unitMorphKeys[key].push(sculptor.selected);
        sort(sculptor.unitMorphKeys[key]);
        sculptor.selected.setMaterial(labeledMaterial);
        updateMorphUIMap[key](sculptor.selected);
        // morphRowValueMap[key].setDisplay('');
    }

    function removeKey (key) {
        if (sculptor.unitMorphKeys[key].indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(sculptor.currentMaterial);
            sculptor.unitMorphKeys[key].splice(sculptor.unitMorphKeys[key].indexOf(sculptor.selected),1);
            morphRowValueMap[key].setDisplay('none');
            sculptor.selected.userData.morphTrans[key] = morphResetMap[key];
            updateSculpture(key);
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
        if (!(obj instanceof Unit)||sculptor.currentMorph=='') {
            morphSettingRow.setDisplay('none');
            return;
        } else {
            morphSettingRow.setDisplay('');
        }
        let key = morphMaps[sculptor.currentMorph]
        let controls = sculptor.unitMorphKeys[key];
        let idx = controls.indexOf(obj);
        if (idx < 0) {
            setControl.setValue(false);
            morphRowValueMap[key].setDisplay('none');
        } else {
            setControl.setValue(true);
            updateMorphUIMap[key](obj);
            if (idx ==0 || idx == controls.length-1) {
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

    return container;
}