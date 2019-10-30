/**
 * @author hermanncain
 */

var Toolbar = function ( sculptor ) {

    let signals = sculptor.signals;

	var container = new UI.Panel();
	container.setId( 'toolbar' );

    // draw unit skeletons
    var unitSkeletonRow = new UI.Row();
    container.add(unitSkeletonRow);

    var drawRibButton = new UI.Button().setId('add-end').onClick(function(){
        // exit draw end point mode
        if (sculptor.drawMode == 'vp') {
            signals.drawModeChanged.dispatch('normal');
            drawRibButton.dom.classList.remove('selected');
        } else {
            // enter draw end point mode
            signals.drawModeChanged.dispatch('vp');
            drawRibButton.dom.classList.add('selected');
        }
    });
    drawRibButton.dom.title = 'draw an end to initialize a skeleton curve';
    unitSkeletonRow.add(drawRibButton);

    var circleArrayButton = new UI.Button().setId('ca').onClick(simulateCA);
    circleArrayButton.dom.title = 'circle array';
    unitSkeletonRow.add(circleArrayButton);
    
    var caRow = new UI.Row().setDisplay('none');
    unitSkeletonRow.add(caRow);
    caRow.add(new UI.Text('#').setClass('param').setWidth('10px'));
    var caNumber = new UI.Integer(4).setRange(2,30).setWidth('30px').onChange(simulateCA);
    caRow.add(caNumber);
    var generateArray = new UI.Button().setId('gca').onClick(function () {
        if (!sculptor.selected) return;
        sculptor.unit.addTempleRibs();
        sculptor.select(null);
        hideArray();
    });
    caRow.add(generateArray);
    var cancelArrayButton = new UI.Button().setId('cca').onClick(cancelArray);
    caRow.add(cancelArrayButton);

    // TOOD
    var selectAll = new UI.Button().setId('select-all');
    // unitSkeletonRow.add(selectAll);

    var generateUnitMesh = new UI.Button().setId('gen').onClick(function(){
        sculptor.unit.generateShape();
    });
    unitSkeletonRow.add(generateUnitMesh);

    var clearUnitMesh = new UI.Button().setId('clear').onClick(function(){
        sculptor.unit.clearShapes();
    });
    unitSkeletonRow.add(clearUnitMesh);

    function simulateCA () {
        if (!(sculptor.selected instanceof Rib)) return;
        // enter circle array parameter configuration
        if (circleArrayButton.dom.id.indexOf('selected')<0) {
            circleArrayButton.dom.classList.add('selected');
            caRow.setDisplay('inline');
            sculptor.unit.clearTemp();
            sculptor.unit.generateCircleArray(sculptor.selected,caNumber.getValue());
        } else {
            circleArrayButton.dom.classList.remove('selected');
            caRow.setDisplay('none');
        }
    }

    function cancelArray(){
        sculptor.unit.clearTemp();
        hideArray();
    }

    function hideArray() {
        circleArrayButton.dom.classList.remove('selected');
        caRow.setDisplay('none');
    }

    // draw sketches as sculpture skeletons
    var buttons = [];
    var sketchRow = new UI.Row();
    container.add(sketchRow);

    // free drawings: line and spline
    var lineButton = new UI.Button().setId('line').onClick(function(){
        selectButton(lineButton.dom.id);
    });
    sketchRow.add(lineButton);

    var splineButton = new UI.Button().setId('spline').onClick(function(){
        selectButton(splineButton.dom.id);
    });
    sketchRow.add(splineButton);

    buttons.push(...[lineButton, splineButton]);

    // parametric drawings: ellipse, sin, helix, torus knot, decorative knot
    var ellipseButton = new UI.Button().setId('ellipse').onClick(function(){
        var ellipse = new Sketch('Ellipse', [], [0,0,5,5,0,360,0,0]);
        sculptor.addSketch(ellipse);
    });
    sketchRow.add(ellipseButton);

    var sinButton = new UI.Button().setId('sin').onClick(function(){
        var sin = new Sketch('Sin', [], [1,1,0,0,360]);
        sculptor.addSketch(sin);
    });
    sketchRow.add(sinButton);

    var spiralButton = new UI.Button().setId('spiral').onClick(function(){
        var spiral = new Sketch('Spiral',[],[2,0,1,3]);
        sculptor.addSketch(spiral);
    });
    sketchRow.add(spiralButton);

    var torusKnotButton = new UI.Button().setId('torusKnot').onClick(function(){
        var knot = new Sketch('TorusKnot', [], [5,2,2,3]);
        sculptor.addSketch(knot);
    });
    sketchRow.add(torusKnotButton);

    // TODO
    var decorativeKnotButton = new UI.Button().setId('decorativeKnot').onClick(function(){
        var knot = new Sketch('DecoratedTorusKnot', [], [2,0.6,5,0.75,10,0.35,5]);
        sculptor.addSketch(knot);
    });
    // sketchRow.add(decorativeKnotButton);

    var roleButtonRow = new UI.Row().setDisplay('none');
    sketchRow.add(roleButtonRow);

    var setAxisButton = new UI.Button().setId('set-axis').onClick(function(){
        setSketchRole('axis');
    });
    roleButtonRow.add(setAxisButton);

    var setReferenceButton = new UI.Button().setId('set-reference').onClick(function(){
        setSketchRole('reference');
    });
    roleButtonRow.add(setReferenceButton);

    // TODO
    var setContourButton = new UI.Button().setId('make-axis').onClick(function(){
        setSketchRole('contour');
    });
    // roleButtonRow.add(setContourButton);
    let roleButtons = {'axis':setAxisButton, 'reference': setReferenceButton, 'contour':setContourButton};

    function setSketchRole (role) {
        if (sculptor.selected instanceof Sketch) {
            if (sculptor.selected.role == role) {
                sculptor.setRole(sculptor.selected,'sketch');
            } else {
                sculptor.setRole(sculptor.selected,role);
            }
        }
        updateRoleButtons(role);
    }

    function updateRoleButtons (role) {
        for (let key in roleButtons) {
            if (key == role) {
                roleButtons[key].dom.classList.add('selected');
            } else {
                roleButtons[key].dom.classList.remove('selected');      
            }
        }
    }

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

    function updateToolbarUI () {
        if (sculptor.currentScene.name == 'unit-scene') {
            unitSkeletonRow.setDisplay('');
            sketchRow.setDisplay('none');
        } else {
            unitSkeletonRow.setDisplay('none');
            sketchRow.setDisplay('');
        }
    }
    updateToolbarUI();

    // event handler
    signals.drawModeChanged.add(function(mode){
        if (mode == 'normal') {
            drawRibButton.dom.classList.remove('selected');
        }
    });

    signals.objectSelected.add(function(object) {
        if (!object) {
            if (sculptor.unit.templeSkeleton.children.length>0) {
                cancelArray();
            }
        }
        if (object instanceof Sketch) {
            roleButtonRow.setDisplay('inline');
            updateRoleButtons(object.role);
        } else {
            roleButtonRow.setDisplay('none')
        }
    });

    signals.drawModeChanged.add(function (mode) {
        updateUI();
    });

    signals.sceneChanged.add(function () {
        updateToolbarUI();
    })

    return container;

}