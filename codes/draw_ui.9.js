/*
~~~~~~~~~~~~~~~~~~~~~~~~Party Bars~~~~~~~~~~~~~~~~~~~~~~~~
*/

setInterval(() => {
    let $ = parent.$;
    let partied = $('#newparty');
    if (partied){
        for (let x=0; x < partied.children().length; x++){
            let info = get(Object.entries(parent.party)[x][0]);
			if(info == null) {
				return;
			}
            let infoHTML = `<div>${info.name}</div>`;
            infoHTML += `<div style="background: transparent; position: relative"><div style="background-color: #8B0000; width: ${info.hp/info.max_hp*100}%; height: 20px; position: absolute; top: 0;"></div><div style="position: absolute; top: 0; width: 100%"><text style="width: 100%; text-align: center;">hp: ${Math.round(info.hp / info.max_hp * 100)}%</text></div></div>`;
            infoHTML += `<div style="position: relative; margin-top: 25px"><div style="background-color: #0071DC; width: ${info.mp/info.max_mp*100}%; height: 20px; position: absolute; top: 0;"></div><div style="position: absolute; top: 0; width: 100%;"><text style="width: 100%; text-align: center;">mp: ${Math.round(info.mp/info.max_mp*100)}%</text></div></div>`;
            infoHTML += `<div style="position: relative; margin-top: 50px;"><div style="background-color: ${info.cc > 150 ? 'red' : 'green'}; width: ${info.cc/200*100}%; height: 20px; position: absolute; top: 0;"></div><div style="position: absolute; top: 0; width: 100%;"><text style="width: 100%; text-align: center;">cc: ${Math.round(info.cc)}</text></div></div>`
            //spacer Div
            infoHTML += `<div style="height:20px;"></div>`;
            infoHTML += `</div></div>`;
			if(info.eSize != null) { 
				infoHTML += `<div>Bag: ${info.items.length - info.eSize} / ${info.items.length}</div>`;
			} else {
				infoHTML += `<div>Bag: 0 / ${info.items.length}</div>`;
			}
			infoHTML += `<div style="color: yellow">gold: ${info.gold} </div>`;
            partied.children().css({
                width: '120px',
                padding: '5px',
            });
            partied.find(partied.children()[x]).children().last().html(`<div style="font-size: 20px; font-weight: bold;">${infoHTML}</div>`);
        }
    }

}, 100)

function swapDivs(){
    let $ = parent.$;
    let nparty = $('#newparty');
    let servinfo = $('#serverinfo');
    $('#serverinfo').remove();
    nparty.before(servinfo);
    $('#serverinfo').css({'vertical-align': 'top', 'padding': '5px'});
}

swapDivs();