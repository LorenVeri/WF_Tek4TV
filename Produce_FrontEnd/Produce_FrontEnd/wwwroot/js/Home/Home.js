////import '~/';

const ViewModal = function () {
    const self = this;

    self.showtoastState = function (msg, title) {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-top-right",
            "onclick": null,
            "showDuration": "3000",
            "hideDuration": "3000",
            "timeOut": "3000",
            "extendedTimeOut": "3000",
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
            "showDuration": "3000",
            "hideDuration": "3000",
            "timeOut": "3000",
            "extendedTimeOut": "3000",
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

    self.gotoItem = function (item) {
        window.location.href = '/chi-tiet/' + item.ID() + '-' + self.slugifyLink(item.Name());
    }

    self.sortItem = ko.observable('id');
    //Get Procedure
    self.first = ko.observable(100);
    self.totalCountProcedure = ko.observable()
    self.produceList = ko.observableArray();
    self.getProduce = function () {
        $.ajax({
            method: "POST",
            url: backendUrl + "/graphql",
            contentType: "application/json",
            data: JSON.stringify({
                query: `query {
                          produce(where: {isDelete:{eq: false}}, first: 100, order: {${self.sortItem()}:DESC}) {
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
            }),
            success: function (res) {
                self.produceList([])
                if (res.data.totalCount != 0) {
                    $.each(res.data.produce.nodes, function (ex, item) {
                        item.selected = false;
                        self.produceList.push(self.convertToKoObject(item));
                    })
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }

    self.sortProcedure = function () {
        $.ajax({
            method: "POST",
            url: backendUrl + "/graphql",
            contentType: "application/json",
            data: JSON.stringify({
                query: `query {
                          produce(where: {isDelete:{eq: false}}, first: 100) {
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
            }),
            success: function (res) {
                self.produceList([])
                if (res.data.totalCount != 0) {
                    $.each(res.data.produce.nodes, function (ex, item) {
                        self.produceList.push(self.convertToKoObject(item));
                    })
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }

    //Function Procedure
    self.deleteProcedure = function (item) {
        const query = `mutation($data: Int!) {
                          deleteProduce(id: $data)
                        }
                        `
        bootbox.confirm({
            message: "Bạn có muốn xóa WorkFlow: '" + item.name() + "'?",
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
                                "data": item.id()
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

    //End Procedure

    $("input").keyup(function () {
        alert("Changed!");
    });

    $('#checked').change(function () {
        console.log("dfdfd");
    });

    self.callApi = function () {
        self.getProduce();
    }

}

$(function () {
    const viewModal = new ViewModal();
    viewModal.callApi();
    ko.applyBindings(viewModal);
})