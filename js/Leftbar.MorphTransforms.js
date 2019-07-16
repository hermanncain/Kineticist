Leftbar.MorphTransforms = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('morphtransforms');
    // return container;
    // Inner transforms
    container.add(new UI.Text('Morph ops').setFontSize('20px').setWidth('100%'));

    // morph translation
    var biasRow = new UI.Row();
    container.add(biasRow);
    biasRow.add(new UI.Text('t').setWidth('30px').setMarginLeft('20px'));
    biasRow.add(new UI.Button('+').onClick(function (){
        addKey('bias');
    }));
    biasRow.add(new UI.Button('-').onClick(function (){
        removeKey('bias');
    }));
    biasValueRow = new UI.Row().setDisplay('none');
    container.add(biasValueRow);
    var xBias = new UI.Number().onChange(function () {
        updateSculpture('bias');
    });
    biasValueRow.add(xBias);
    var yBias = new UI.Number().onChange(function () {
        updateSculpture('bias');
    });
    biasValueRow.add(yBias);
    var zBias = new UI.Number().onChange(function () {
        updateSculpture('bias');
    });
    biasValueRow.add(zBias);

    // morph rotation
    var rotationRow = new UI.Row();
    container.add(rotationRow);
    rotationRow.add(new UI.Text('r').setWidth('30px').setMarginLeft('20px'));
    rotationRow.add(new UI.Button('+').onClick(function (){
        addKey('rotation');
    }));
    rotationRow.add(new UI.Button('-').onClick(function (){
        removeKey('rotation');
    }));
    rotationValueRow = new UI.Row().setDisplay('none');
    container.add(rotationValueRow);
    var xRotation = new UI.Number().setRange(-30,30).onChange(function () {
        updateSculpture('rotation');
    });
    rotationValueRow.add(xRotation);
    var yRotation = new UI.Number().setRange(-30,30).onChange(function () {
        updateSculpture('rotation');
    });
    rotationValueRow.add(yRotation);
    var zRotation = new UI.Number().onChange(function () {
        updateSculpture('rotation');
    });
    rotationValueRow.add(zRotation);

    // morph scale
    var sizeRow = new UI.Row();
    container.add(sizeRow);
    sizeRow.add(new UI.Text('s').setWidth('30px').setMarginLeft('20px'));
    sizeRow.add(new UI.Button('+').onClick(function (){
        addKey('size');
    }));
    sizeRow.add(new UI.Button('-').onClick(function (){
        removeKey('size');
    }));
    sizeValueRow = new UI.Row().setDisplay('none');
    container.add(sizeValueRow);
    var xSize = new UI.Number().onChange(function () {
        updateSculpture('size');
    });
    sizeValueRow.add(xSize);
    var ySize = new UI.Number().onChange(function () {
        updateSculpture('size');
    });
    sizeValueRow.add(ySize);

    let morphRowMap = {'bias':biasValueRow,'rotation':rotationValueRow,'size':sizeValueRow};
    let updateMorphUIMap = {'bias':updateBiasUI,'rotation':updateRotationUI,'size':updateSizeUI};
    let morphOpMap = {'bias':'setMorphTranslation','rotation':'setMorphRotation','size':'setMorphScale'};
    let morphResetMap = {'bias':[0,0,0],'rotation':[0,0,0],'size':[1,1,1]};

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

    function addKey (key) {
        if (sculptor.selected instanceof Unit) {
            sculptor.unitMorphKeys[key].push(sculptor.selected);
            sort(sculptor.unitMorphKeys[key]);
            sculptor.selected.setMaterial(labeledMaterial);
            updateMorphUIMap[key](sculptor.selected);
        }
        morphRowMap[key].setDisplay('');
    }

    function removeKey (key) {
        if (sculptor.unitMorphKeys[key].indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(sculptor.currentMaterial);
            sculptor.unitMorphKeys[key].splice(sculptor.unitMorphKeys[key].indexOf(sculptor.selected),1);
            morphRowMap[key].setDisplay('none');
            sculptor.selected.userData.morphTrans[key] = morphResetMap[key];
            updateSculpture(key);
        }        
    }

    function updateSculpture (key) {
        if (!(sculptor.selected instanceof Unit)) return;
        let value = null;
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
                let itp = new THREE.LinearInterpolant(idx,s,1);
                ns.push(itp.evaluate(i)[0]);
            }
            sculptor.sculpture.units.children[i][morphOpMap[key]](ns[0],ns[1],ns[2]);
            sculptor.sculpture.units.children[i].generateShape();
        }
        
    }

    function updateBiasUI(unit) {
        xBias.setValue(unit.userData.morphTrans.bias[0]);
        yBias.setValue(unit.userData.morphTrans.bias[1]);
        zBias.setValue(unit.userData.morphTrans.bias[2]);
        biasValueRow.setDisplay('');
    }
    function updateRotationUI(unit) {
        xRotation.setValue(unit.userData.morphTrans.rotation[0]/Math.PI*180);
        yRotation.setValue(unit.userData.morphTrans.rotation[1]/Math.PI*180);
        zRotation.setValue(unit.userData.morphTrans.rotation[2]/Math.PI*180);
        rotationValueRow.setDisplay('');
    }
    function updateSizeUI(unit) {
        xSize.setValue(unit.userData.morphTrans.size[0]);
        ySize.setValue(unit.userData.morphTrans.size[1]);
        // zSize.setValue(unit.userData.morphTrans.size[2]);
        sizeValueRow.setDisplay('');
    }

    signals.objectSelected.add(function(obj){
        if (!(obj instanceof Unit)) {
            container.setDisplay('none');
        } else {
            container.setDisplay('');
        }
        for (let key in sculptor.unitMorphKeys) {
            if (sculptor.unitMorphKeys[key].indexOf(obj)<0) {
                morphRowMap[key].setDisplay('none');
            } else {
                updateMorphUIMap[key](obj);
            }
        }
    })

    return container;
}