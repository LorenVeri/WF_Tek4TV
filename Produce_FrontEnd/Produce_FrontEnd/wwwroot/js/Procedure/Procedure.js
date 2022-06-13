
const ViewModal = function () {
    let node = document.getElementById('node-detail');
    let link = document.getElementById('link-detail');
    const self = this;

    let dataNode;
    self.init= function () {

        // Since 2.2 you can also author concise templates with method chaining instead of GraphObject.make
        // For details, see https://gojs.net/latest/intro/buildingObjects.html
        const $ = go.GraphObject.make;  // for conciseness in defining templates

        // some constants that will be reused within templates
        var roundedRectangleParams = {
            parameter1: 2,  // set the rounded corner
            spot1: go.Spot.TopLeft, spot2: go.Spot.BottomRight  // make content go all the way to inside edges of rounded corners
        };

        myDiagram =
            $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
                {
                    "animationManager.initialAnimationStyle": go.AnimationManager.None,
                    "InitialAnimationStarting": e => {
                        var animation = e.subject.defaultAnimation;
                        animation.easing = go.Animation.EaseOutExpo;
                        animation.duration = 900;
                        animation.add(e.diagram, 'scale', 0.1, 1);
                        animation.add(e.diagram, 'opacity', 0, 1);
                    },

                    // have mouse wheel events zoom in and out instead of scroll up and down
                    "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
                    // support double-click in background creating a new node
                    "clickCreatingTool.archetypeNodeData": { text: "new node" },
                    // enable undo & redo
                    "undoManager.isEnabled": true,
                    positionComputation: function (diagram, pt) {
                        return new go.Point(Math.floor(pt.x), Math.floor(pt.y));
                    }
                });

        // when the document is modified, add a "*" to the title and enable the "Save" button
        myDiagram.addDiagramListener("Modified", function (e) {
            var button = document.getElementById("SaveButton");
            if (button) button.disabled = !myDiagram.isModified;
            var idx = document.title.indexOf("*");
            if (myDiagram.isModified) {
                if (idx < 0) document.title += "*";
            } else {
                if (idx >= 0) document.title = document.title.slice(0, idx);
            }
        });

        // define the Node template
        myDiagram.nodeTemplate =
            $(go.Node, "Auto",
                {
                    locationSpot: go.Spot.Top,
                    isShadowed: true, shadowBlur: 1,
                    shadowOffset: new go.Point(0, 1),
                    shadowColor: "rgba(0, 0, 0, .14)"
                },
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                // define the node's outer shape, which will surround the TextBlock
                $(go.Shape, "RoundedRectangle", roundedRectangleParams,
                    {
                        name: "SHAPE", fill: "#ffffff", strokeWidth: 0,
                        stroke: null,
                        portId: "",  // this Shape is the Node's port, not the whole Node
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                        cursor: "pointer"
                    }),
                $(go.TextBlock,
                    {
                        font: "bold small-caps 11pt helvetica, bold arial, sans-serif", margin: 7, stroke: "rgba(0, 0, 0, .87)",
                        editable: true  // editing the text automatically updates the model data
                    },
                    new go.Binding("text").makeTwoWay())
            );


        // unlike the normal selection Adornment, this one includes a Button
        myDiagram.nodeTemplate.selectionAdornmentTemplate =
            $(go.Adornment, "Spot",
                $(go.Panel, "Auto",
                    $(go.Shape, "RoundedRectangle", roundedRectangleParams,
                        { fill: null, stroke: "#7986cb", strokeWidth: 3 }),
                    $(go.Placeholder)  // a Placeholder sizes itself to the selected Node
                ),
                // the button to create a "next" node, at the top-right corner
                $("Button",
                    {
                        alignment: go.Spot.TopRight,
                        click: addNodeAndLink  // this function is defined below
                    },
                    $(go.Shape, "PlusLine", { width: 6, height: 6 })
                ) // end button
            ); // end Adornment

        myDiagram.nodeTemplateMap.add("Start",
            $(go.Node, "Spot", { desiredSize: new go.Size(75, 75) },
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Circle",
                    {
                        fill: "#52ce60", /* green */
                        stroke: null,
                        portId: "",
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                        cursor: "pointer"
                    }),
                $(go.TextBlock, "Start",
                    {
                        font: "bold 16pt helvetica, bold arial, sans-serif",
                        stroke: "whitesmoke"
                    })
            )
        );

        myDiagram.nodeTemplateMap.add("End",
            $(go.Node, "Spot", { desiredSize: new go.Size(75, 75) },
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "Circle",
                    {
                        fill: "maroon",
                        stroke: null,
                        portId: "",
                        fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                        toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                        cursor: "pointer"
                    }),
                $(go.Shape, "Circle", { fill: null, desiredSize: new go.Size(65, 65), strokeWidth: 2, stroke: "whitesmoke" }),
                $(go.TextBlock, "End",
                    {
                        font: "bold 16pt helvetica, bold arial, sans-serif",
                        stroke: "whitesmoke"
                    })
            )
        );

        // clicking the button inserts a new node to the right of the selected node,
        // and adds a link to that new node
        function addNodeAndLink(e, obj) {
            var adornment = obj.part;
            var diagram = e.diagram;
            diagram.startTransaction("Add State");

            // get the node data for which the user clicked the button
            var fromNode = adornment.adornedPart;
            var fromData = fromNode.data;
            // create a new "State" data object, positioned off to the right of the adorned Node
            var toData = { text: "new" };
            var p = fromNode.location.copy();
            p.x += 200;
            toData.loc = go.Point.stringify(p);  // the "loc" property is a string, not a Point object
            // add the new node data to the model
            var model = diagram.model;
            model.addNodeData(toData);

            // create a link data from the old node data to the new node data
            var linkdata = {
                from: model.getKeyForNodeData(fromData),  // or just: fromData.id
                to: model.getKeyForNodeData(toData),
                text: "transition"
            };
            // and add the link data to the model
            model.addLinkData(linkdata);

            // select the new Node
            var newnode = diagram.findNodeForData(toData);
            diagram.select(newnode);

            diagram.commitTransaction("Add State");

            // if the new node is off-screen, scroll the diagram to show the new node
            diagram.scrollToRect(newnode.actualBounds);
        }

        // replace the default Link template in the linkTemplateMap
        myDiagram.linkTemplate =
            $(go.Link,  // the whole link panel
                {
                    curve: go.Link.Bezier,
                    adjusting: go.Link.Stretch,
                    reshapable: true, relinkableFrom: true, relinkableTo: true,
                    toShortLength: 3
                },
                new go.Binding("points").makeTwoWay(),
                new go.Binding("curviness"),
                $(go.Shape,  // the link shape
                    { strokeWidth: 1.5 },
                    new go.Binding('stroke', 'progress', progress => progress ? "#52ce60" /* green */ : 'black'),
                    new go.Binding('strokeWidth', 'progress', progress => progress ? 2.5 : 1.5)),
                $(go.Shape,  // the arrowhead
                    { toArrow: "standard", stroke: null },
                    new go.Binding('fill', 'progress', progress => progress ? "#52ce60" /* green */ : 'black')),
                $(go.Panel, "Auto",
                    $(go.Shape,  // the label background, which becomes transparent around the edges
                        {
                            fill: $(go.Brush, "Radial",
                                { 0: "rgb(245, 245, 245)", 0.7: "rgb(245, 245, 245)", 1: "rgba(245, 245, 245, 0)" }),
                            stroke: null
                        }),
                    $(go.TextBlock, "transition",  // the label text
                        {
                            textAlign: "center",
                            font: "9pt helvetica, arial, sans-serif",
                            margin: 4,
                            editable: true  // enable in-place editing
                        },
                        // editing the text automatically updates the model data
                        new go.Binding("text").makeTwoWay())
                )
        );

        self.nodeDetail = ko.observable();
        self.linkDetail = ko.observable();
        // read in the JSON data from the "mySavedModel" element
        myDiagram.addDiagramListener("ObjectSingleClicked",
            function (e) {
                var part = e.subject.part;
                if (!(part instanceof go.Link)) {
                    dataNode = part.data;
                    self.nodeDetail(self.convertToKoObject(part.data))
                    link.classList.remove('toggle-show');
                    node.classList.add('toggle-show');
                } else {
                    self.linkDetail(self.convertToKoObject(part.data))
                    node.classList.remove('toggle-show');
                    link.classList.add('toggle-show');
                }
            }
        );
    }


    //const 
    self.hideDetail = function() {
        node.classList.remove('toggle-show');
        link.classList.remove('toggle-show');
    }

    function save() {
        document.getElementById("mySavedModel").value = myDiagram.model.toJson();
        myDiagram.isModified = false;
    }

    function load(item) {
        myDiagram.model = go.Model.fromJson(item.data());
    }

    self.showtoastState = function (msg, title) {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-top-right",
            "onclick": null,
            "showDuration": "500",
            "hideDuration": "500",
            "timeOut": "500",
            "extendedTimeOut": "500",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }
        toastr['success'](title, msg);
    };
    self.showtoastError = function (msg, title) {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-top-right",
            "onclick": null,
            "showDuration": "500",
            "hideDuration": "500",
            "timeOut": "500",
            "extendedTimeOut": "500",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }
        toastr['error'](title, msg);
    };

    self.convertToKoObject = function (data) {
        var newObj = ko.mapping.fromJS(data);
        return newObj;
    }

    self.getUrl = function () {
        var urlArray = window.location.href.substring(window.location.href.lastIndexOf('#') + 1).split("/");
        if (urlArray[3] == "them-moi") {
            var obj = {
                id: 0,
                name: '',
                isDelete: false,
                data: '{ "class": "GraphLinksModel","nodeDataArray": [],"linkDataArray": []}'
            }
            self.selectedProduce(self.convertToKoObject(obj));
            load(self.selectedProduce());
        } else {
            var id = urlArray[urlArray.length - 1].split("-")[0];
            self.getProduce(id)
        }
    }

    
    //Get Produce
    self.first = ko.observable(100);
    self.produce = ko.observable();
    self.selectedProduce = ko.observable();
    self.getProduce = function (id) {
        var query = `query($data: Int) {
                      produce(where: {id:{eq: $data}}) {
                        totalCount
                        nodes {
                          id
                          name
                          data
                          isDelete
                           createAt
                        }
                      }
                    }
                    `
        $.ajax({
            method: "POST",
            url: backendUrl + "/graphql",
            contentType: "application/json",
            data: JSON.stringify({
                query: query,
                variables: {
                    "data": Number(id)
                }
            }),
            success: function (res) {
                if (res.data.totalCount != 0) {
                    $.each(res.data.produce.nodes, function (ex, item) {
                        self.selectedProduce(self.convertToKoObject(item));
                        load(self.selectedProduce());
                        self.produce(self.convertToKoObject(item));
                    })
                }
            },
            error: function (err) {
            }
        });
    }

    self.callApi = function () {
        self.getProduce();
    }

    self.loadProduce = function () {
        myDiagram.model = go.Model.fromJson($("#mySavedModel").val());
    }

    self.saveProduce = function () {
        document.getElementById("mySavedModel").value = myDiagram.model.toJson();
        myDiagram.isModified = false;
    }

    //Function Procedure
    self.deleteProcedure = function () {
        const query = `mutation($data: Int!) {
                          deleteProduce(id: $data)
                        }
                        `
        bootbox.confirm({
            message: "Bạn có muốn xóa WorkFlow: '" + self.produce().name() + "'?",
            buttons: {
                confirm: {
                    label: 'Đồng ý',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'Hủy bỏ',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                if (result) {
                    $.ajax({
                        url: backendUrl + "/graphql",
                        type: "POST",
                        data: JSON.stringify({
                            query: query,
                            variables: {
                                "data": self.produce().id()
                            }
                        }),
                        contentType: 'application/json',
                        dataType: 'json',
                        error: function (err) {
                            switch (err.status !== 200) {
                                case "400":
                                    // bad request
                                    self.showtoastError('Có lỗi', 'bad request')
                                    break;
                                case "401":
                                    // unauthorized
                                    self.showtoastError('Có lỗi', 'unauthorized')
                                    break;
                                case "403":
                                    // forbidden
                                    self.showtoastError('Có lỗi', 'forbidden')
                                    break;
                                default:
                                    self.showtoastError('Có lỗi', 'Something bad happened')
                                    //Something bad happened
                                    break;
                            }
                        },
                        success: function (data) {
                            self.showtoastState('Thành công', "Đã xóa dữ liệu");
                        }
                    });
                }
            }
        })
    }

    self.createProduce = function () {
        if ($("#mySavedModel").val().length == 0) {
            self.showtoastError('Có lỗi', "Bạn chưa nhập tên ")
        }
        else {
            var query = `
                        mutation($data: ProduceInput!) {
                          createProduce(item: $data)
                        }
                        `

            var data = {
                id: self.selectedProduce().id(),
                name: $("#name-procedure").val(),
                data: $("#mySavedModel").val(),
                isDelete: self.selectedProduce().isDelete()
            };

            console.log(data);

            $.ajax({
                url: backendUrl + "/graphql",
                type: "POST",
                data: JSON.stringify({
                    query: query,
                    variables: { data }
                }),
                contentType: 'application/json',
                dataType: 'json',
                error: function (err) {
                    switch (err.status !== 200) {
                        case "400":
                            // bad request
                            self.showtoastError('Có lỗi', 'bad request')
                            break;
                        case "401":
                            // unauthorized
                            self.showtoastError('Có lỗi', 'unauthorized')
                            break;
                        case "403":
                            // forbidden
                            self.showtoastError('Có lỗi', 'forbidden')
                            break;
                        default:
                            self.showtoastError('Có lỗi', 'Something bad happened')
                            //Something bad happened
                            break;
                    }
                },
                success: function (data) {
                    if (data = null) {
                        self.showtoastError('Có lỗi', 'Vui lòng thêm mới lại')
                    } else {
                        if (self.selectedProduce().id() > 0) {
                            $('#modal-state').modal('hide')
                            self.showtoastState('Thành công', "Đã cập nhật dữ liệu");
                            self.getProduce();
                            self.loadProduce();
                        } else {
                            self.showtoastState('Thành công', "Đã thêm mới quy trình");
                            self.getProduce();
                        }
                    }
                }
            });
        }
    }

    self.editNode = function () {
        dataNode.text = self.nodeDetail().text();
        self.saveProduce()
        self.createProduce()
    }


    self.selectedState = ko.observable();
    self.count = ko.observable(0)
    self.modalState = function () {
        self.count()++;
        let obj = {
            Check: true,
            Color: "#de60cd",
            Description: "",
            ID: self.count(),
            Name: "",
            Order: 0,
            PublishState: false,
            StartState: true,
            Roles: [],
            User: [],
        };

        self.selectedState(self.convertToKoObject(obj))
    }

    self.addState = function () {
        var state = {
            Check: self.selectedState().Check(),
            Color: self.selectedState().Color(),
            Description: self.selectedState().Description(),
            ID: self.selectedState().ID(),
            Name: self.selectedState().Name(),
            Order: self.selectedState().Order(),
            PublishState: self.selectedState().PublishState(),
            StartState: self.selectedState().StartState(),
            Roles: self.selectedState().Roles(),
            User: self.selectedState().User()
        }
        dataNode.state = self.nodeDetail().text();
        self.saveProduce()
        self.createProduce()
    }

    self.selectedState = ko.observable();
    self.count = ko.observable(0)
    self.modalState = function () {
        $('#modal-state').modal('show')
        let obj = {
            Check: true,
            Color: "#de60cd",
            Description: "",
            ID: self.count(),
            Name: "",
            Order: 0,
            PublishState: false,
            StartState: true,
            Roles: [],
            User: [],
        };

        self.selectedState(self.convertToKoObject(obj))
    }

    self.createState = function () {
        let listState = []

        let state = {
            Check: self.selectedState().Check(),
            Color: self.selectedState().Color(),
            Description: self.selectedState().Description(),
            ID: self.selectedState().ID(),
            Name: self.selectedState().Name(),
            Order: self.selectedState().Order(),
            PublishState: self.selectedState().PublishState(),
            StartState: self.selectedState().StartState(),
            Roles: self.selectedState().Roles(),
            User: self.selectedState().User()
        }

        listState.push(state);
        dataNode.state = listState;
        self.saveProduce()
        self.createProduce()
    }

}


$(function () {
    const viewModal = new ViewModal();
    viewModal.init();
    viewModal.callApi();
    viewModal.getUrl();
    ko.applyBindings(viewModal);
})



