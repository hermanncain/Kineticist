Rightbar.Mechanism = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('rightbar-mechanism');
    container.setDisplay('none');

    // curve roles
    var curveRoleRow = new UI.Row()
    container.add( curveRoleRow );
    curveRoleRow.add(new UI.Text('Curve role').setFontSize('20px').setWidth('100%'));

    // roles
    var roleRow = new UI.Row();
    curveRoleRow.add(roleRow);

    var makeSketchButton = new UI.Button().setId('make-sketch').onClick(function () {
        setRole('sketch');
    });
    roleRow.add( makeSketchButton );
    var makeAxisButton = new UI.Button().setId('make-axis').onClick(function () {
        setRole('axis');
    });
    roleRow.add( makeAxisButton );
    var makeContourButton = new UI.Button().setId('make-contour').onClick(function () {
        setRole('contour');
    });
    roleRow.add( makeContourButton );

    var roles = [makeSketchButton,makeAxisButton,makeContourButton];
    curveRoleRow.add( new UI.HorizontalRule() );


    // time orders
    
    var timeOrderRow = new UI.Row();
    container.add(timeOrderRow);
    timeOrderRow.add(new UI.Text('Time order').setFontSize('20px').setWidth('100%'));
    
    var removeOrder = new UI.Button('none').onClick(function(){
        if (sculptor.selected instanceof Sketch) {
            sculptor.selected.setTimeOrder(0);
        }
    })
    timeOrderRow.add(removeOrder);
    var orders = [removeOrder];

    for (let i=1;i<5;i++) {
        var setTi = new UI.Button(i).setBackgroundColor('#'+timeOrderColors[i].toString(16)).onClick(function(){
            updateOrderUI(i);
            setRole('contour');
            sculptor.selected.setTimeOrder(i);
        });
        timeOrderRow.add(setTi);
        orders.push(setTi);
    }
    

    timeOrderRow.add( new UI.HorizontalRule() );

    // prototype
    var prototypeRow = new UI.Row();
    prototypeRow.setDisplay('none');
    container.add(prototypeRow);
    prototypeRow.add(new UI.Text('Prototype').setFontSize('20px').setWidth('100%'));

    // sampling frequency
    var samplingFrequencyRow = new UI.Row().setMargin('10px');
    prototypeRow.add( samplingFrequencyRow );

    samplingFrequencyRow.add( new UI.Text( 'Density' ).setWidth( '100px' ) );
    var samplingFrequency = new UI.Integer( 20 )
    samplingFrequencyRow.add( samplingFrequency );

    // generation distance
    var generationDistanceRow = new UI.Row().setMargin('10px');
    prototypeRow.add( generationDistanceRow );

    generationDistanceRow.add( new UI.Text( 'Distance' ).setWidth( '100px' ) );
    var generationDistance = new UI.Number( 8 )
    generationDistanceRow.add( generationDistance );

    // generation yaw
    var yawRow = new UI.Row().setMargin('10px');
    prototypeRow.add( yawRow );

    yawRow.add( new UI.Text( 'Direction' ).setWidth( '100px' ) );
    var yaw = new UI.Number( 0 ).setUnit( '°' )
    yawRow.add( yaw );

    // prototyping with sketches without time order
    var singleRow = new UI.Row();
    prototypeRow.add(singleRow);

    // generate a prototype
    var generateSkeletonButton = new UI.Button().setId('skeleton').onClick(function () {
        sculptor.sculpture.buildSkeleton(generationDistance.getValue(),samplingFrequency.getValue());
    });
    singleRow.add( generateSkeletonButton );

    // TODO
    // generate meshes
    // var gg = new UI.Button().onClick(function () {
    //     sculptor.sculpture.units.children.map(function(u){
    //         u.generateShape();
    //     });
    // })
    // singleRow.add( gg );

    // clear the prototype
    var clearSkeleton = new UI.Button().setId('clear-skeleton').onClick(function(){
        sculptor.sculpture.clearSkeleton();
    });
    singleRow.add( clearSkeleton );

    
    // prototyping with ordered sketches
    var multiRow = new UI.Row();
    prototypeRow.add(multiRow);
    
    // axis type
    multiRow.add(new UI.Text('axis type: ').setMargin('10px'));
    var axisType = new UI.Select();
    multiRow.add(axisType);
    axisType.setMultiple = false;
    axisType.setOptions(['closed','open']);
    axisType.setValue(0);

    // solve prototype
    var solveSkeletons = new UI.Button('solve').onClick(function(){
        sculptor.solveSkeletons(samplingFrequency.getValue(),axisType.getValue());
    });
    multiRow.add(solveSkeletons);

    // test axis generation
    var testAxisGen = new UI.Button('new').onClick(function(){
        sculptor.testAxisGen(samplingFrequency.getValue(),axisType.getValue());
    });
    multiRow.add(testAxisGen);

    // var testJunctionEnv = new UI.Button('junc env').onClick(function(){
    //     // sculptor.testJunction(samplingFrequency.getValue());
    // });
    // multiRow.add(testJunctionEnv);

    prototypeRow.add( new UI.HorizontalRule() );


    // outlines
    var outLineRow = new UI.Row();
    outLineRow.setDisplay('none');
    container.add(outLineRow);
    outLineRow.add(new UI.Text('Outlines').setFontSize('20px').setWidth('100%'));

    var outlineButton = new UI.Button().setId('outline').onClick(function () {
        if (sculptor.sculpture==undefined) {
            return;
        }
        sculptor.sculpture.buildOutlines();
    });
    outLineRow.add(outlineButton);

    var clearOutlineButton = new UI.Button().setId('clear-outline').onClick(function () {
        if (sculptor.sculpture==undefined) {
            return;
        }
        sculptor.sculpture.clearOutlines();
    });
    outLineRow.add(clearOutlineButton);


    // set roles
    function setRole (role) {
        if (!sculptor.selected instanceof Sketch) {
            return;
        }
        if (sculptor.selected.role == role) {
            return;
        } else {
            sculptor.setRole(sculptor.selected, role);
        }
        updateRoleUI(role);
    }

    function updateRoleUI (role) {
        for (let b of roles) {
            if (b.dom.id.indexOf(role)>-1) {
                b.dom.classList.add('selected');
            } else {
                b.dom.classList.remove('selected');
            }
        }
    }

    function updateOrderUI (n) {
        for (let i=0;i<orders.length;i++) {
            if (i == n) {
                orders[i].dom.classList.add('selected');
            } else {
                orders[i].dom.classList.remove('selected');
            }
        }
    }

    function updateUI (object) {
        if (object.role == 'axis') {
            prototypeRow.setDisplay('');
            timeOrderRow.setDisplay('none');
        } else if (object.role == 'reference') {
            prototypeRow.setDisplay('none');
        } else {
            prototypeRow.setDisplay('none');
        }
    }

    signals.objectSelected.add(function(obj){
        if(obj instanceof Sketch) {
            updateRoleUI(obj.role);
            updateOrderUI(obj.timeOrder);
            container.setDisplay( '' );
            sketch = obj;
		    updateUI( obj );
        } else {
            container.setDisplay( 'none' );
        }
    })

    signals.sceneChanged.add(function(name){
        if (name == 'layoutScene') {
            curveRoleRow.setDisplay('none');
            timeOrderRow.setDisplay('none');
            prototypeRow.setDisplay('');
            outLineRow.setDisplay('');
        } else {
            curveRoleRow.setDisplay('');
            timeOrderRow.setDisplay('');
            prototypeRow.setDisplay('none');
            outLineRow.setDisplay('none');
        }
    });
    
    return container;
}