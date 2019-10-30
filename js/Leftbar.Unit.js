Leftbar.Unit = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-unit');

    var content = new UI.Panel().setClass('content');
    container.add(content);

    // draw unit skeletons
    var skeletonRow = new UI.Row();
    content.add(skeletonRow);

    // skeleton semantics control
    var semanticConfig = new Leftbar.Unit.Semantic(sculptor);
    skeletonRow.add( semanticConfig );

    // sweeping control
    var bladeConfig = new Leftbar.Unit.Blade(sculptor);
    content.add( bladeConfig );

    // accessory control
    var accessoryConfig = new Leftbar.Unit.Accessory(sculptor);
    content.add( accessoryConfig );

    signals.objectSelected.add(function(object) {
        if (!object) {
            semanticConfig.setDisplay( 'none' );
            bladeConfig.setDisplay( 'none' );
            accessoryConfig.setDisplay( 'none' );
        }
        if (object) {
            if (object instanceof Rib) {
                semanticConfig.setDisplay( '' );
                bladeConfig.setDisplay( '' );
                accessoryConfig.setDisplay( '' );
            } else {
                semanticConfig.setDisplay( 'none' );
                bladeConfig.setDisplay( 'none' );
                accessoryConfig.setDisplay( 'none' );
            }
        }
        
    });
    
    return container;

}