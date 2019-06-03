Rightbar.Mechanism = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('rightbar-mechanism');
    container.setDisplay('none');

    var sketch = null;

    // switch sketch types
    // var curveTypeRow = new UI.Row()
    // container.add( curveTypeRow );
    var setAsAxisButton = new UI.Button().setId('setAxis').onClick(setAsAxis);
    container.add( setAsAxisButton );
    var setAsContourButton = new UI.Button().setId('setContour').onClick(setAsContour);
    container.add( setAsContourButton );

    // add dependence between axis and contours
    var appendButton = new UI.Button().setId('append').onClick(addContours);
    container.add( appendButton );
    var attachButton = new UI.Button().setId('attach').onClick(addToAxis);
    container.add( attachButton );
    var detachButton = new UI.Button().setId('detach').onClick(detach);
    container.add( detachButton );
    // container.add( new UI.HorizontalRule() );

    // generate skeletons
    var skeletonPanel = new UI.Panel();
    container.add(skeletonPanel);
    // sampling frequency
    var samplingFrequencyRow = new UI.Row().setMargin('10px');
    skeletonPanel.add( samplingFrequencyRow );
    samplingFrequencyRow.add( new UI.Text( 'Density' ).setWidth( '100px' ) );
    var samplingFrequency = new UI.Integer( 30 ).onChange( update );
    samplingFrequencyRow.add( samplingFrequency );
    // generation distance
    var generationDistanceRow = new UI.Row().setMargin('10px');
    skeletonPanel.add( generationDistanceRow );
    generationDistanceRow.add( new UI.Text( 'Threshold' ).setWidth( '100px' ) );
    var generationDistance = new UI.Number( 8 ).onChange( update );
    generationDistanceRow.add( generationDistance );
    // generation yaw
    var yawRow = new UI.Row().setMargin('10px');
    skeletonPanel.add( yawRow );
    yawRow.add( new UI.Text( 'Direction' ).setWidth( '100px' ) );
    var yaw = new UI.Number( 0 ).setUnit( '°' ).onChange( update );
    yawRow.add( yaw );
    // bone shape
    var boneShapeButton = new UI.Button().setId('bone').onClick(function(){

    });
    skeletonPanel.add( boneShapeButton );
    // generate skeleton
    var generateSkeletonButton = new UI.Button().setId('skeleton').onClick(generateSkeleton);
    skeletonPanel.add( generateSkeletonButton );
    // clear skeleton
    var clearSkeleton = new UI.Button().setId('clear-skeleton').onClick(function(){
        sculptor.selectedSculpture.clearSkeleton();
    });
    skeletonPanel.add( clearSkeleton );

    container.add( new UI.HorizontalRule() );

    var viewRow = new UI.Row();
    container.add( viewRow );

    viewRow.add(new UI.Text('transmission envelope'));
    var showTransmissionEnvelope = new UI.Checkbox(false).onChange(function (){
        sculptor.sculpture.units.children.map(function(u){
            u.transmissions.traverse(function(o){
                if (o.name == 'motion envelope') {
                    o.visible = showTransmissionEnvelope.getValue();
                }
            })
        })
    });
    viewRow.add(showTransmissionEnvelope);

    
    // Set curve type
    // set as axis
    function setAsAxis () {
        sculptor.setAsAxis(sketch);
    }
    // set as contour
    function setAsContour () {
        sculptor.setAsContour(sketch);
    }
    
    function addContours() {
        signals.selectModeChanged.dispatch('append');
    }

    // Selected curve is a contour
    // add to axis
    function addToAxis() {
        signals.selectModeChanged.dispatch('attach');
    }

    function detach () {
        if (sculptor.selectedSketch.curveType == 'reference') {
            let s = null;
            for (let axis of sculptor.axes) {
                let sculpture = sculptor.sculptures[axis.uuid];
                if (sculpture.references.indexOf(sculptor.selectedSketch)>=0) {
                    s = sculpture;
                }
            }
            s.removeReference(sculptor.selectedSketch);
            sculptor.selectedSketch.select();
        } else if (sculptor.selectedSketch.curveType == 'axis') {
            sculptor.selectedSculpture.clearReference();
        }
        
    }

    function generateSkeleton () {
        sculptor.selectedSculpture.buildSkeleton(generationDistance.getValue(),samplingFrequency.getValue());
    }

    function update () {

    }

    function updateUI (object) {
        if (object.curveType == 'axis') {
            setAsAxisButton.dom.classList.add('selected');
            setAsContourButton.dom.classList.remove('selected');
            appendButton.setDisplay('');
            attachButton.setDisplay('none');
            skeletonPanel.setDisplay('');
            detachButton.setDisplay('');
        } else if (object.curveType == 'reference') {
            setAsAxisButton.dom.classList.remove('selected');
            setAsContourButton.dom.classList.add('selected');
            appendButton.setDisplay('none');
            attachButton.setDisplay('none');
            skeletonPanel.setDisplay('none');
            detachButton.setDisplay('');
        } else {
            setAsAxisButton.dom.classList.remove('selected');
            setAsContourButton.dom.classList.add('selected');
            appendButton.setDisplay('none');
            if (sculptor.axes.length==0) {
                attachButton.setDisplay('none');
            } else {
                attachButton.setDisplay('');
            }
            skeletonPanel.setDisplay('none');
            detachButton.setDisplay('none');
        }
    }

    signals.objectSelected.add(function(obj){
        if(obj==null) {

        }
    })

    signals.sketchSelected.add( function ( object ) {

        if ( object !== null ) {

			container.setDisplay( '' );
            sketch = object;
		    updateUI( object );

		} else {

			container.setDisplay( 'none' );

		}

    });

    signals.sketchChanged.add(function (object) {
        updateUI(object);
    })

    return container;
}