// pages/test.js
Page({

    /**
     * 组件的初始数据
     */
    data: {
        papertitle:"教资语法",
        perform:0,
        showrst:false,
        //slotreply:['','','',''],
        //checkData: [
        //{ques_title: "专利包括哪些类型？", ques_type: "选择题",quesid:3,item_a:"发明",item_b:"实用新型",item_c:"外观设计",item_d:""}, 
        //{ques_title: "九年义务教育包括哪些？", ques_type: "选择题",quesid:4,item_a:"幼儿园",item_b:"小学",item_c:"初中",item_d:"高中"},
        //{ques_title: "今天会下雨。", ques_type: "判断题",quesid:5,item_a:"",item_b:"",item_c:"",item_d:""},
        //{ques_title: "今天__A__的__B__不错。", ques_type: "填空题",quesid:6,item_a:"上海",item_b:"天气",item_c:"",item_d:""},
        //],
        checkData:[],
        daan:[],
        reply:[]
    },

    onShareAppMessage: function () {
        return {
            title:this.data.papertitle
          }
    },

    /**
     * 组件的方法列表
     */
    //methods: {
        onLoad: function (options) {
            let paperid = options.pid;
            console.log(paperid);
            var that=this;
            wx.request({
            url: 'https://zishu.co/api/ques/fetchqueses/',
            //url: 'https://zishu.co/v1/jc/fetchqueses/',
            data: {
                pid: paperid,
            },
            method: 'POST',
            dataType: 'json',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
                'chartset': 'utf-8'
            },
            success(res){
                that.setData({
                papertitle:res['data']['testpaper_title'],
                checkData:JSON.parse(res['data']['answers'])
                })
                for (var i=0;i<that.data.checkData.length;i++){
                    if (that.data.checkData[i]["ques_type"]=="填空题"){
                        that.data.checkData[i]["reply"]=['','','',''];
                    } else {
                        that.data.checkData[i]["reply"]='';
                    }
                    //console.log(that.data.checkData[i])
                    that.data.checkData[i]["check"]=false;
                    that.data.checkData[i]["submitted"]=false;
                }
            },
            fail(err){
                console.log('失败啦！')
                console.log(err)

            }
            })
          },
        
        checkClick: function (event) {
            //console.log(event.detail.value);
            //console.log(event.target);
            var ind = event.target.id.split('-')[0];
            //console.log(this.data.checkData[ind]["answer"]);
            
            this.data.checkData[ind]["reply"]=event.detail.value.slice().sort().join('');
            if (this.data.checkData[ind]["reply"]==this.data.checkData[ind]["answer"]){
                this.data.checkData[ind]["check"]=true;
            } else {
                this.data.checkData[ind]["check"]=false;
            }
            this.setData({
                checkData:this.data.checkData,
            })
          },
        checkRadio: function (event) {
            //console.log(event.detail.value);
            var ind = event.target.id.split('-')[0];
            //console.log(ind);
            this.data.checkData[ind]["reply"]=event.detail.value;
            if (this.data.checkData[ind]["reply"]==this.data.checkData[ind]["answer"]){
                this.data.checkData[ind]["check"]=true;
            } else {
                this.data.checkData[ind]["check"]=false;
            }
            this.setData({
                checkData:this.data.checkData,
            })
        },
        checkSlot: function (event) {
            var ind = event.target.id.split('-')[0];
            var slot = event.target.id.split('-')[1];
            if (slot=='A'){
                this.data.checkData[ind]["reply"][0]=event.detail.value;
            } else if (slot=='B'){
                this.data.checkData[ind]["reply"][1]=event.detail.value;
            } else if (slot=='C'){
                this.data.checkData[ind]["reply"][2]=event.detail.value;
            } else if (slot=='D'){
                this.data.checkData[ind]["reply"][3]=event.detail.value;
            }
            var realreply=[]
            for(var i=0;i<4;i++){
                if(this.data.checkData[ind]["reply"][i]){
                    realreply.push(this.data.checkData[ind]["reply"][i])
                }
            }
            var finalreply = realreply.join(',')
            if (finalreply==this.data.checkData[ind]["answer"]){
                this.data.checkData[ind]["check"]=true;
            } else {
                this.data.checkData[ind]["check"]=false;
            }
            this.setData({
                checkData:this.data.checkData,
            })
            //this.data.reply[event.target.id]=event.detail.value;
        },
        onSubmit: function(){
            var score = 0;
            for (var i=0;i<this.data.checkData.length;i++){
                if(this.data.checkData[i]["check"]==true){
                    score += 1;
                }
                this.data.checkData[i]["submitted"]=true;
            }
            this.perform = Math.ceil(score*100/this.data.checkData.length);
            this.showrst = true;
            this.setData({
                checkData:this.data.checkData,
                perform:this.perform,
                showrst:this.showrst,
            })

        }
    //}
})
