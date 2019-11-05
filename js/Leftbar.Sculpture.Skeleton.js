Leftbar.Sculpture.Skeleton = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('mechanisms').setMargin('0').setPadding('0');
    container.add(
        new UI.Text('Skeleton').setClass('bar-title')
    );
    var content = new UI.Panel().setClass('content');
    container.add(content);

    // sampling frequency
    var samplingFrequencyRow = new UI.Row();
    content.add( samplingFrequencyRow );

    samplingFrequencyRow.add( new UI.Text( 'density' ).setClass('param-semantics') );
    var samplingFrequency = new UI.Integer( 20 )
    samplingFrequencyRow.add( samplingFrequency );

    // generation distance
    var generationDistanceRow = new UI.Row();
    content.add( generationDistanceRow );

    generationDistanceRow.add( new UI.Text( 'radius' ).setClass('param-semantics') );
    var generationDistance = new UI.Number( 8 )
    generationDistanceRow.add( generationDistance );

    // TODO
    // generation yaw
    var yawRow = new UI.Row();
    // content.add( yawRow );
    yawRow.add( new UI.Text( 'direction' ).setClass('param-semantics') );
    var yaw = new UI.Number( 0 ).setUnit( '°' )
    yawRow.add( yaw );

    // generate a prototype
    var generateSkeletonButton = new UI.Button().setId('skeleton').onClick(function () {
        if (sculptor.sculpture.axis == null || sculptor.sculpture.contours.length==0) {
            return;
        }
        sculptor.sculpture.buildSkeleton(generationDistance.getValue(),samplingFrequency.getValue());
    });
    content.add( generateSkeletonButton );

    // clear the prototype
    var clearSkeleton = new UI.Button().setId('clear-skeleton').onClick(function(){
        sculptor.sculpture.clearSkeleton();
    });
    content.add( clearSkeleton );

    // TODO
    // build dynamic outlines by connecting all ends using splines
    
    // TODO
    // morph skeletons
    
    // TODO
    // generate units with default shapes
    var genUnits = new UI.Button().setId('generate-unit').onClick(generateUnits);
    content.add( genUnits );

    function generateUnits () {
        let sculpture = sculptor.sculpture;
        for (let u of sculpture.units.children) {
            for (let rib of u.skeleton.children) {
                rib.addMarker(1,0.5,0);
                rib.sectionShapeParams = {
                    'a':0.05,
                    'b':0.05
                };
            }
            u.generateShape();
        }
        sculpture.buildAxle();
    }

    return container;

}