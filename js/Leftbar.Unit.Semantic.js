Leftbar.Unit.Semantic = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit-semantic').add(
        new UI.HorizontalRule(),
        new UI.Text('semantics').setClass('sect-title')
    );
    container.setDisplay('none');

    // radical semantics
    container.add(new UI.Text('◆ radial bias').setClass('param-semantics'));
    var bias = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(bias);
    container.add(new UI.Text('◆ radial sep').setClass('param-semantics'));
    var separation = new UI.Number(0).setRange(0,1).onChange(updateRib);
    container.add(separation);

    // tangent semantics
    container.add(new UI.Text('◆ tan bend').setClass('param-semantics'));
    var tangentArch = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(tangentArch);
    container.add(new UI.Text('◆ tan wave').setClass('param-semantics'));
    var tangentWave = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(tangentWave);

    // axial semantics
    container.add(new UI.Text('◆ axial bend').setClass('param-semantics'));
    var axialArch = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(axialArch);
    container.add(new UI.Text('◆ axial wave').setClass('param-semantics'));
    var axialWave = new UI.Number(0).setRange(-1,1).onChange(updateRib);
    container.add(axialWave);

    // event handler
    function updateRib() {
        if (sculptor.selectedObjects.length>0) {
            for (let rib of sculptor.selectedObjects) {
                rib.setSep(separation.getValue());
                rib.setBias(bias.getValue());
                rib.setTangentArch(tangentArch.getValue());
                rib.setTangentWave(tangentWave.getValue());
                rib.setAxialArch(axialArch.getValue());
                rib.setAxialWave(axialWave.getValue());
            }
        } else {
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