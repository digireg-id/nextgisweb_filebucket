define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom-class",   
    "dojo/store/Memory",
    "dojo/store/Observable",
    "dijit/layout/LayoutContainer",
    "dijit/form/Button",
    "dijit/Toolbar",
    "dijit/ProgressBar",
    "dojox/form/Uploader",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/editor",
    "dgrid/extensions/DijitRegistry",    
    "ngw/route",
    "ngw-resource/serialize"
], function (
    declare,
    lang,
    array,
    domStyle,
    domClass,
    Memory,
    Observable,
    LayoutContainer,
    Button,
    Toolbar,
    ProgressBar,
    Uploader,
    Grid,
    Selection,
    editor,
    DijitRegistry,
    route,
    serialize
) {
    // Uploader AMD workaround
    Uploader = dojox.form.Uploader;    

    var GridClass = declare([Grid, Selection, DijitRegistry], {
        selectionMode: "single",

        columns: [
            {
                field: "name",
                label: "Имя файла",
                sortable: true
            },

            {
                field: "mime_type",
                label: "Тип MIME",
                sortable: true
            },

            {
                field: "size",
                label: "Размер",
                sortable: true
            }
        ]
    });


    return declare([LayoutContainer, serialize.Mixin], {
        title: "Набор файлов",
        serializePrefix: "file_bucket",

        constructor: function () {
            this.store = new Observable(new Memory({idProperty: "name"}));
        },

        buildRendering: function () {
            this.inherited(arguments);

            this.toolbar = new Toolbar({
                region: 'top'
            }).placeAt(this);

            this.uploader = new Uploader({
                label: "Загрузить файлы",
                iconClass: "dijitIconNewTask",
                multiple: true,
                uploadOnSelect: true,
                url: route.file_upload.upload(),
                name: "file"
            }).placeAt(this.toolbar);

            this.uploader.on("complete", lang.hitch(this, function (data) {
                array.forEach(data.upload_meta, function (f) {
                    this.store.put(f);
                }, this);

                domStyle.set(this.progressbar.domNode, 'display', 'none');
            }));

            this.uploader.on("begin", lang.hitch(this, function () {
                domStyle.set(this.progressbar.domNode, 'display', 'block');
            }));

            this.uploader.on("progress", lang.hitch(this, function (evt) {
                if (evt.type == "progress") {
                    this.progressbar.set('value', evt.decimal * 100);
                }
            }));

            this.toolbar.addChild(new Button({
                label: "Удалить",
                iconClass: "dijitIconDelete",
                onClick: lang.hitch(this, function () {
                    for (var key in this.grid.selection) {
                        this.store.remove(key);
                    }
                })
            }));             

            this.progressbar = new ProgressBar({
                style: "float: right; margin-right: 4px; width: 10em; display: none;"
            }).placeAt(this.toolbar);

            this.grid = new GridClass({store: this.store});
            this.grid.region = "center";

            domClass.add(this.grid.domNode, "dgrid-border-fix");
            domStyle.set(this.grid.domNode, "border", "none");

            this.addChild(this.grid);
        },

        deserializeInMixin: function (data) {
            var files = data.file_bucket.files;
            for (var key in files) { this.store.add(files[key]) }
        },       

        serializeInMixin: function (data) {
            if (data.file_bucket === undefined) { data.file_bucket = {}; }
            data.file_bucket.files = [];

            var files = data.file_bucket.files;
            this.store.query().forEach(function (f) { files.push(f) });
        }

    });
});