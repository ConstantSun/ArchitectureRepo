import { getRef, getRefList } from "./shared_funcs.js";

async function crawlImgs(){
    // var res = await getRefList([], [])
    // console.log("hi: ")
    // // console.log(res)
    // for (let index = 0; index < res.length; index++) {
    //     const element = res[index];
    //     console.log("Hello ... ")
    //     console.log(element)
        
    // }

    var res = await getRef('Amazon-EventBridge')
    console.log("res 1: ", res)

    var res = await getRef('Amazon EventBridge')
    console.log("res 2: ", res)
}
crawlImgs()