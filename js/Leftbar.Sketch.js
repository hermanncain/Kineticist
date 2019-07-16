/**
 * @author hermanncain
 */

Leftbar.Sketch = function (sculptor) {

    var signals = sculptor.signals;

    var container = new UI.Panel().setId('leftbar-sketch').setDisplay('none');

    // var container = new UI.Panel().setMargin('15px');
    // container.add(container);
    var buttons = [];

    // 1. hand-drawn curves
    // container.add(new UI.Text('draw').setWidth('160px'));

    // pointed, no-referenced, can-be-closed
    var lineButton = new UI.Button().setId('line').onClick(function(){
        selectButton(lineButton.dom.id);
    });
    container.add(lineButton);

    var splineButton = new UI.Button().setId('spline').onClick(function(){
        selectButton(splineButton.dom.id);
    });
    container.add(splineButton);
    
    var brush2DButton = new UI.Button().setId('brush2d').onClick(function(){
        selectButton(brush2DButton.dom.id);
    });
    container.add(brush2DButton);
    
    // TODO
    // var brush3DButton = new UI.Button().setId('brush3d').onClick(function(){
    //     selectButton(brush3DButton.dom.id);
    // });
    // container.add(brush3DButton);
    container.add(new UI.HorizontalRule());

    buttons.push(...[lineButton, splineButton, brush2DButton/* , brush3DButton */]);

    // 2. instanced curves
    // parametric, no-referenced, closed
    var ellipseButton = new UI.Button().setId('ellipse').onClick(function(){
        var ellipse = new Sketch('Ellipse', [], [0,0,5,5,0,360,0,0]);
        sculptor.addSketch(ellipse);
    });
    container.add(ellipseButton);

    var sinButton = new UI.Button().setId('sin').onClick(function(){
        var sin = new Sketch('Sin', [], [1,1,0,0,360]);
        sculptor.addSketch(sin);
    });
    container.add(sinButton);
    // container.add(new UI.HorizontalRule());

    // 3. referenced curves
    // parametric, referenced, unclosed
    var spiralButton = new UI.Button().setId('spiral').onClick(function(){
        var spiral = new Sketch('Spiral',[],[2,0,1,3]);
        sculptor.addSketch(spiral);
    });
    container.add(spiralButton);

    //parametric, referenced, closed
    var torusKnotButton = new UI.Button().setId('torusKnot').onClick(function(){
        var knot = new Sketch('TorusKnot', [], [5,2,2,3]);
        sculptor.addSketch(knot);
    });
    container.add(torusKnotButton);
    var decorativeKnotButton = new UI.Button().setId('decorativeKnot').onClick(function(){
        var knot = new Sketch('DecoratedTorusKnot', [], [2,0.6,5,0.75,10,0.35,5]);
        sculptor.addSketch(knot);
    });
    container.add(decorativeKnotButton);
    // TODO
    // var importCurveButton = new UI.Button().setId('importCurve').onClick(function(){
        
    // });
    // container.add(importCurveButton);
    container.add(new UI.HorizontalRule());


    // curve operations
    // var biasButton = new UI.Button().setId('bias').onClick(function(){
    //     selectButton(biasButton.dom.id);
    // });
    // container.add(biasButton);
    // var sampleButton = new UI.Button().setId('sample').onClick(function(){
    //     selectButton(sampleButton.dom.id);
    // });
    // container.add(sampleButton);
    // var cutButton = new UI.Button().setId('cut').onClick(function(){
    //     selectButton(cutButton.dom.id);
    // });
    // container.add(cutButton);
    // var projectButton = new UI.Button().setId('projection').onClick(function(){
    //     selectButton(projectButton.dom.id);
    // });
    // container.add(projectButton);
    // container.add(new UI.HorizontalRule());
    // container.add(new UI.HorizontalRule());

    // buttons.push(...[cutButton, projectButton]);

    // surface
    // container.add(new UI.Text('surface'));
        
    // build surface
    // var extrudeButton = new UI.Button().setId('extrude').onClick(function(){
    //     selectButton(extrudeButton.dom.id);
    // });
    // container.add(extrudeButton);
    // var revolveButton = new UI.Button().setId('revolve').onClick(function(){
    //     selectButton(revolveButton.dom.id);
    // });
    // container.add(revolveButton);
    // var expandButton = new UI.Button().setId('expand').onClick(function(){
    //     selectButton(expandButton.dom.id);
    // });
    // container.add(expandButton);
    // var autoButton = new UI.Button().setId('auto').onClick(function(){
    //     selectButton(autoButton.dom.id);
    // });
    // container.add(autoButton);
    // var generateRow = new UI.Row();
    // container.add(generateRow);

    // buttons.push(...[autoButton,revolveButton,extrudeButton,expandButton]);

    var geometryConfig = new Leftbar.Geometry(sculptor);
    container.add( geometryConfig );

    function selectButton (mode) {
        signals.drawModeChanged.dispatch(mode);
        updateUI();
    }

    function updateUI () {
        buttons.forEach(b=>{
            b.dom.classList.remove('selected');
            if (b.dom.id == sculptor.drawMode) {
                b.dom.classList.add('selected');
            }
        });
    }

    signals.drawModeChanged.add(function (mode) {
        updateUI();
    });

    return container;

}