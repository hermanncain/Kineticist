Rightbar.Transforms.Inner = function (sculptor) {

    var signals = sculptor.signals;

    var oldMat = sculptor.unit.currentMaterial;
    var newMat = sculptor.unit.currentMaterial.clone();

    var container = new UI.Panel().setId('rightbar-inner-transforms');

    // Inner transforms
    container.add(new UI.Text('Morph ops').setFontSize('20px'));

    // inner bias
    var biasRow = new UI.Row();
    container.add(biasRow);
    biasRow.add(new UI.Text('translation').setWidth('70px'));
    biasRow.add(new UI.Button('+').onClick(function (){
        if (sculptor.selected instanceof Unit) {
            sculptor.unitMorphKeys.bias.push(sculptor.selected);
            sort(sculptor.unitMorphKeys.bias);
            tempChangeMaterial('bias','show');
            updateBiasUI(sculptor.selected);
        }
    }));
    biasRow.add(new UI.Button('-').onClick(function (){
        if (sculptor.unitMorphKeys.bias.indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(oldMat);
            sculptor.unitMorphKeys.bias.splice(sculptor.unitMorphKeys.bias.indexOf(sculptor.selected),1);
            biasValueRow.setDisplay('none');
            sculptor.selected.userData.innerTransform.bias = [0,0,0];
            updateBias();
        }
    }));
    biasValueRow = new UI.Row().setDisplay('none');
    container.add(biasValueRow);
    var xBias = new UI.Number().onChange(updateBias);
    biasValueRow.add(xBias);
    var yBias = new UI.Number().onChange(updateBias);
    biasValueRow.add(yBias);
    var zBias = new UI.Number().onChange(updateBias);
    biasValueRow.add(zBias);

    // inner rotation
    var rotationRow = new UI.Row();
    container.add(rotationRow);
    rotationRow.add(new UI.Text('rotation').setWidth('70px'));
    rotationRow.add(new UI.Button('+').onClick(function (){
        if (sculptor.selected instanceof Unit) {
            sculptor.unitMorphKeys.rotation.push(sculptor.selected);
            sort(sculptor.unitMorphKeys.rotation);
            tempChangeMaterial('rotation','show');
            updateRotationUI(sculptor.selected);
        }
        
    }));
    rotationRow.add(new UI.Button('-').onClick(function (){
        if (sculptor.unitMorphKeys.rotation.indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(oldMat);
            sculptor.unitMorphKeys.rotation.splice(sculptor.unitMorphKeys.rotation.indexOf(sculptor.selected),1);
            rotationValueRow.setDisplay('none');
            sculptor.selected.userData.innerTransform.rotation = [0,0,0];
            updateRotation();
        }
    }));
    rotationValueRow = new UI.Row().setDisplay('none');
    container.add(rotationValueRow);
    var xRotation = new UI.Number().setRange(-30,30).onChange(updateRotation);
    rotationValueRow.add(xRotation);
    var yRotation = new UI.Number().setRange(-30,30).onChange(updateRotation);
    rotationValueRow.add(yRotation);
    var zRotation = new UI.Number().onChange(updateRotation);
    rotationValueRow.add(zRotation);

    // inner scale
    var sizeRow = new UI.Row();
    container.add(sizeRow);
    sizeRow.add(new UI.Text('scale').setWidth('70px'));
    sizeRow.add(new UI.Button('+').onClick(function (){
        if (sculptor.selected instanceof Unit) {
            sculptor.unitMorphKeys.size.push(sculptor.selected);
            sort(sculptor.unitMorphKeys.size);
            tempChangeMaterial('size','show');
            updateSizeUI(sculptor.selected);
        }
    }));
    sizeRow.add(new UI.Button('-').onClick(function (){
        if (sculptor.unitMorphKeys.size.indexOf(sculptor.selected)>=0) {
            sculptor.selected.setMaterial(oldMat);
            sculptor.unitMorphKeys.size.splice(sculptor.unitMorphKeys.size.indexOf(sculptor.selected),1);
            sizeValueRow.setDisplay('none');
            sculptor.selected.userData.innerTransform.size = [1,1,1];
            updateSize();
        }
    }));
    sizeValueRow = new UI.Row().setDisplay('none');
    container.add(sizeValueRow);
    var xSize = new UI.Number().onChange(updateSize);
    sizeValueRow.add(xSize);
    var ySize = new UI.Number().onChange(updateSize);
    sizeValueRow.add(ySize);
    // var zSize = new UI.Number().onChange(updateSize);
    // sizeValueRow.add(zSize);

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

    function updateBiasUI(unit) {
        xBias.setValue(unit.userData.innerTransform.bias[0]);
        yBias.setValue(unit.userData.innerTransform.bias[1]);
        zBias.setValue(unit.userData.innerTransform.bias[2]);
        biasValueRow.setDisplay('');
    }
    function updateRotationUI(unit) {
        xRotation.setValue(unit.userData.innerTransform.rotation[0]/Math.PI*180);
        yRotation.setValue(unit.userData.innerTransform.rotation[1]/Math.PI*180);
        zRotation.setValue(unit.userData.innerTransform.rotation[2]/Math.PI*180);
        rotationValueRow.setDisplay('');
    }
    function updateSizeUI(unit) {
        xSize.setValue(unit.userData.innerTransform.size[0]);
        ySize.setValue(unit.userData.innerTransform.size[1]);
        // zSize.setValue(unit.userData.innerTransform.size[2]);
        sizeValueRow.setDisplay('');
    }

    function updateBias() {
        if (!(sculptor.selected instanceof Unit)) return;
        sculptor.selected.userData.innerTransform.bias = [xBias.getValue(),yBias.getValue(),zBias.getValue()];
        let idx = sculptor.unitMorphKeys.bias.map(function(u){return sculptor.sculpture.units.children.indexOf(u)});
        for (let i = 0;i<sculptor.sculpture.units.children.length;i++) {
            let nb=[];
            for (let j=0;j<3;j++) {
                let b = sculptor.unitMorphKeys.bias.map(function(u){return u.userData.innerTransform.bias[j]});
                let itp = new THREE.LinearInterpolant(idx,b,1);
                nb.push(itp.evaluate(i)[0]);
            }
            sculptor.sculpture.units.children[i].setInnerTranslation(nb[0],nb[1],nb[2]);
            sculptor.sculpture.units.children[i].generateShape();
        }
    }
    function updateRotation() {
        if (!(sculptor.selected instanceof Unit)) return;
        sculptor.selected.userData.innerTransform.rotation = [xRotation.getValue()*Math.PI/180,yRotation.getValue()*Math.PI/180,zRotation.getValue()*Math.PI/180];
        let idx = sculptor.unitMorphKeys.rotation.map(function(u){return sculptor.sculpture.units.children.indexOf(u)});
        for (let i = 0;i<sculptor.sculpture.units.children.length;i++) {
            let nr=[];
            for (let j=0;j<3;j++) {
                let r = sculptor.unitMorphKeys.rotation.map(function(u){return u.userData.innerTransform.rotation[j]});
                let itp = new THREE.LinearInterpolant(idx,r,1);
                nr.push(itp.evaluate(i)[0]);
            }
            sculptor.sculpture.units.children[i].setInnerRotation(nr[0],nr[1],nr[2]);
            sculptor.sculpture.units.children[i].generateShape();
        }
    }
    function updateSize() {
        if (!(sculptor.selected instanceof Unit)) return;
        sculptor.selected.setInnerScale(xSize.getValue(),ySize.getValue(),1);
        sculptor.selected.generateShape();
        let idx = sculptor.unitMorphKeys.size.map(function(u){return sculptor.sculpture.units.children.indexOf(u)});
        for (let i = 0;i<sculptor.sculpture.units.children.length;i++) {
            let ns=[];
            for (let j=0;j<3;j++) {
                let s = sculptor.unitMorphKeys.size.map(function(u){return u.userData.innerTransform.size[j]});
                let itp = new THREE.LinearInterpolant(idx,s,1);
                ns.push(itp.evaluate(i)[0]);
            }
            sculptor.sculpture.units.children[i].setInnerScale(ns[0],ns[1],ns[2]);
            sculptor.sculpture.units.children[i].generateShape();
        }
    }
        
    function tempChangeMaterial(type,mode) {
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

    signals.objectSelected.add(function(obj){
        if (!(obj instanceof Unit)) {
            container.setDisplay('none');
        } else {
            container.setDisplay('');
        }
        if (sculptor.unitMorphKeys.bias.indexOf(obj)<0) {
            biasValueRow.setDisplay('none');
        } else {
            updateBiasUI(obj);
        }
        if(sculptor.unitMorphKeys.rotation.indexOf(obj)<0) {
            rotationValueRow.setDisplay('none');
        } else {
            updateRotationUI(obj);
        }
        if(sculptor.unitMorphKeys.size.indexOf(obj)<0) {
            sizeValueRow.setDisplay('none');
        } else {
            updateSizeUI(obj);
        }
    })

    return container;
}