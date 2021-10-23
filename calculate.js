var total = 0;
var item = 0;
var pageSzie = 5;

var opts = {
    method: 'POST',
    headers: { 'accept': 'application/json, text/plain, */*', 'content-type': 'application/json;charset=UTF-8' }
};

function start() {
    opts['body'] = '{"ultronVersion":"2.0"}';
    fetch('https://my.lazada.com.my/customer/api/sync/order-list', opts).then((response) => {
        return response.json();
    }).then((body) => {
        for (let child in body.module.data) {
            if (child.indexOf('root') >= 0) {
                orderList(body.module.linkage, body.module.lifecycle);
                break;
            }
        }
    });
}

function orderList(linkage, lifecycle) {
    opts['body'] = '{' +
        '"data":{"orderList":{"tag":"orderList","fields":{"chosenLimit":{"text":"All Orders","key":6},"selected":"ALL"},"type":"biz"}},' +
        '"linkage":{"common":{"compress":true,"queryParams":"' + linkage.common.queryParams + '"}},' +
        '"lifecycle":{"pageSize":' + pageSzie + ',"totalPageNum":' + lifecycle.totalPageNum + ',"pageNum":' + lifecycle.pageNum + '}}';
    fetch('https://my.lazada.com.my/customer/api/async/order-list', opts).then((response) => {
        return response.json();
    }).then(async (body) => {
        for (let child in body.module.data) {
            if (child.indexOf('orderItem') >= 0 && body.module.data[child].fields.hasOwnProperty("delivery") && body.module.data[child].fields.delivery.status == 'success') {
                let itemTotal = await orderDetails(body.module.data[child].fields.groupId);
                total += itemTotal;
                item++;
                console.log(item + ":", "RM " + itemTotal + " - ", body.module.data[child].fields.title, " - " + body.module.data[child].fields.sku.skuText);
            }
        }
        if (body.module.lifecycle.pageNum < body.module.lifecycle.totalPageNum) {
            body.module.lifecycle.pageNum += 1;
            orderList(linkage, body.module.lifecycle);
        } else {
            console.log('Calculation is completed!');
            console.log('TOTAL ITEM: ' + item);
            console.log('GRAND TOTAL: RM ' + total);
        }
    });
}

function orderDetails(orderString) {
    let oid = orderString.split("_");
    opts['body'] = '{"tradeOrderId":"' + oid[1] + '"}';
    return fetch('https://my.lazada.com.my/customer/api/sync/order-detail', opts).then((response) => {
        return response.json();
    }).then((body) => {
        return parseFloat(body.module.data['totalSummary_' + oid[1]].fields.total.replace(',', '').match(/\d+(\.\d+)/)[0] || 0);
    });
}

start();