/**
 * @author hermanncain
 */

var Bottombar = function ( sculptor ) {

	signals = sculptor.signals;

	var container = new UI.Panel().setId('bottombar');
    var info = new UI.Text('TODO').setMarginLeft('10px');
    
    container.add(info);

    signals.infoChanged.add(function(s) {
        info.setValue(s);
    })

    return container;
}