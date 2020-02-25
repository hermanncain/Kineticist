Leftbar.Sculpture.Skeleton = function (sculptor) {
    var signals = sculptor.signals;

    var container = new UI.Panel().setId('mechanisms').setMargin('0').setPadding('0');
    container.add(
        new UI.Text('Cage').setClass('bar-title')
    );
    var content = new UI.Panel().setClass('content');
    container.add(content);

    // static cage
    let hideStatic = false;
    var hideStaticCageButton = new UI.Button('hide static').setWidth('80px').onClick(function(){
        if (hideStatic) {
            hideStatic = false;
            sculptor.sculpture.contours.map(function(c){
                c.visible = true;
            });
            hideStaticCageButton.dom.classList.add('selected');
        } else {
            hideStatic = true;
            sculptor.sculpture.contours.map(function(c){
                c.visible = false;
            });
            hideStaticCageButton.dom.classList.remove('selected');
        }
    });
    content.add(hideStaticCageButton);

    // sampling frequency
    var samplingFrequencyRow = new UI.Row();
    content.add( samplingFrequencyRow );

    samplingFrequencyRow.add( new UI.Text( 'sampling freq' ).setClass('param-semantics') );
    var samplingFrequency = new UI.Integer( 20 )
    samplingFrequencyRow.add( samplingFrequency );

    // TODO
    // generation yaw
    var yawRow = new UI.Row();
    // content.add( yawRow );
    yawRow.add( new UI.Text( 'direction' ).setClass('param-semantics') );
    var yaw = new UI.Number( 0 ).setUnit( '°' )
    yawRow.add( yaw );

    // generate a prototype
    var generateCageButton = new UI.Button('build dynamic').setWidth('100px').onClick(function(){
        if (sculptor.sculpture.axis == null || sculptor.sculpture.contours.length==0) {
            return;
        }
        // sculptor.sculpture.buildsk(Infinity,20);
        sculptor.sculpture.initDynamicCage();
        //buildSkeleton(generationDistance.getValue(),samplingFrequency.getValue());
    });
    content.add( generateCageButton );

    var copyAddButton = new UI.Button('copy').setWidth('50px').onClick(function(){
        let c = sculptor.sculpture.outlines.children[0].clone();
        sculptor.sculpture.add(c);
    });
    content.add( copyAddButton );
    // var generateSkeletonButton = new UI.Button().setId('skeleton').onClick(function () {
    //     if (sculptor.sculpture.axis == null || sculptor.sculpture.contours.length==0) {
    //         return;
    //     }
    //     // sculptor.sculpture.buildSkeleton(generationDistance.getValue(),samplingFrequency.getValue());
    // });
    // content.add( generateSkeletonButton );

    // clear the prototype
    var clearSkeleton = new UI.Button('clear').setWidth('50px')./* setId('clear-skeleton'). */onClick(function(){
        sculptor.sculpture.clearSkeleton();
    });
    content.add( clearSkeleton );

    // TODO
    // build dynamic outlines by connecting all ends using splines
    
    // TODO
    // morph skeletons
    
    // TODO
    // generate units with default shapes
    // var genUnits = new UI.Button().setId('generate-unit').onClick(generateUnits);
    // content.add( genUnits );

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