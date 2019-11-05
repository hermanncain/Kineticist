Leftbar.Sculpture = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-sculpture').setDisplay('none')

    // 1.1 layout config
    let layout = new Leftbar.Sculpture.Layout(sculptor);
    container.add(layout);

    // 1.2 skeleton
    let skeleton = new Leftbar.Sculpture.Skeleton(sculptor);
    container.add(skeleton);

    // 2. Morphing
    var morphs = new Leftbar.Sculpture.Morphs(sculptor);
    container.add(morphs);

    // 3. Mechanism solving
    let mechanism = new Leftbar.Sculpture.Mechanisms(sculptor);
    container.add(mechanism);

    signals.sceneChanged.add(function(name){
        if (name == 'sculpture-scene') {
            if (sculptor.unit.skeleton.children.length==0) {
                layout.setDisplay('none');
                morphs.setDisplay('none');
                skeleton.setDisplay('');
            } else {
                layout.setDisplay('');
                morphs.setDisplay('');
                skeleton.setDisplay('none');
            }
        }
    });

    return container;

}