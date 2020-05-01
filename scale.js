class ScaleJS {
    constructor(){
        this.dataProvider = null;
    }
    // ==== set
    setDataProvider(prodiver) {
        this.dataProvider = prodiver;
    }
    render (element, name, type, options = {}) {
        element.innerHTML = `<div></div>`;
    }
}