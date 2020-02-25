Leftbar.Sculpture.Mechanisms = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('mechanisms').setMargin('0').setPadding('0');
    container.add(
        new UI.Text('Mechanism').setClass('bar-title')
    );
    var content = new UI.Panel().setClass('content');
    container.add(content);

    // TODO
    // transmission starting radius config

    // TODO
    // solve skeleton only
    var solveTrans = new UI.Button().setId('transmissions').onClick(generateTransmissions);
    container.add(
        // new UI.Text('Mechanism').setClass('bar-title'),
        content.add(
            new UI.Text('solve transmissions').setClass('param').setWidth('90px').setMarginRight('20px'),
            solveTrans
        )
    );

    // TODO
    // mech params
    // driving: axis diameter
    let axisDiameter = new UI.Number(20).setRange(5,20).setPrecision(0.1).setMarginLeft('5px');

    // driven: bearing type (definite type has fixed dimensions)

    // driven: bearing's inner-diameter, outer-diameter
    let bearingDiameter = new UI.Number(10).setRange(5,20).setPrecision(0.1).setMarginLeft('5px');

    // driven: sleeve inner-radius

    // sleeve outer-radius

    // generate mechanical parts
    let genMech = new UI.Button('refine models').setWidth('150px').onClick(function() {
        sculptor.sculpture.axisWidth = axisDiameter.getValue()/200;
        sculptor.sculpture.buildAxle();
        sculptor.sculpture.buildBearings();
    });
    content.add(genMech);
    // clear mechanical parts

    // export an *.stl assembly
    let expSTL = new UI.Button('export stl').setWidth('150px').onClick(function() {
        let assembly = new THREE.Group();
        transMat = grayMaterial.clone();
        transMat.transparent = true;
        transMat.opacity = 0.5;
        let cmat = new THREE.MeshNormalMaterial();

        for (let u of sculptor.sculpture.units.children) {
            let nu = new THREE.Group();
            assembly.add(nu);
            
            let sleeve = u.refineSleeve();
            sleeve.material = cmat;

            nu.add(sleeve);
            if (u.fork) {
                let fork = u.fork.mechanism.clone();
                fork.applyMatrix(u.fork.matrix);
                fork.material = transMat;
                nu.add(fork);
            }
            if (u.rod) {
                let rod = u.rod.mechanism.clone();
                rod.applyMatrix(u.rod.matrix);
                rod.material = transMat;
                nu.add(rod);
            }
            nu.applyMatrix(u.matrix);
            nu.updateMatrixWorld();
        }
        // sculptor.sculpture.visible=false;
        // sculptor.scenes.layoutScene.add(assembly)
        var result = exporter.parse( assembly );
        saveString( result, 'parts.stl' );

    });
    content.add(expSTL);

    function generateTransmissions() {
        if (sculptor.sculpture.units.children.length==0) {
            alert('please layout first!');
            return;
        }
        if (sculptor.sculpture.buildJoints('single',true)) {
            signals.infoChanged.dispatch('Got a feasible solution.');
            // TODO: determine junction phases
            // sculptor.sculpture.buildAxis();
            // sculptor.sculpture.buildBearings();
        } else {
            signals.infoChanged.dispatch('Failed, please modify axis shape near highlighted units, or densify units');
        }
    }

    return container;

}