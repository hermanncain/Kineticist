Leftbar.Unit.Semantic = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit-semantic');
    container.setDisplay('none');

    // container.add(new UI.Text('Semantics'));

    // radical semantics
    container.add(new UI.Text('bias').setWidth('96px').setFontSize('16px'));
    var bias = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(bias);
    container.add(new UI.Text('separation').setWidth('96px').setFontSize('16px'));
    var separation = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(separation);

    // tangent semantics
    container.add(new UI.Text('tangent arch').setWidth('96px').setFontSize('16px'));
    var tangentArch = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(tangentArch);
    container.add(new UI.Text('tangent wave').setWidth('96px').setFontSize('16px'));
    var tangentWave = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(tangentWave);

    // axial semantics
    container.add(new UI.Text('axial arch').setWidth('96px').setFontSize('16px'));
    var axialArch = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(axialArch);
    container.add(new UI.Text('axial wave').setWidth('96px').setFontSize('16px'));
    var axialWave = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(axialWave);

    // event handler
    function updateRib() {
        if (sculptor.selected) {
            let rib = sculptor.selected;
            rib.setSep(separation.getValue());
            rib.setBias(bias.getValue());
            rib.setTangentArch(tangentArch.getValue());
            rib.setTangentWave(tangentWave.getValue());
            
            rib.setAxialArch(axialArch.getValue());
            rib.setAxialWave(axialWave.getValue());
            signals.objectTransformed.dispatch(sculptor.selected);
        }
    }

    function updateRibUI(rib) {
        bias.setValue(rib.getBias());
        separation.setValue(rib.getSep());
        tangentArch.setValue(rib.getTangentArch());
        tangentWave.setValue(rib.getTangentWave());
        axialArch.setValue(rib.getAxialArch());
        axialWave.setValue(rib.getAxialWave());
    }

    // event
    signals.objectSelected.add(function(object) {
        if (object) {
            if (object instanceof Rib) {
                container.setDisplay('');
                updateRibUI(object);
            } else {
                container.setDisplay('none');
            }
        }
        
    });

    signals.objectTransformed.add(function(object){
        if (object) {
            if (object.name == 'ribpoint') {
                let rib = object.parent.parent;
                updateRibUI(rib);
            }
        }
    });

    return container;

};