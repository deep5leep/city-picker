/*	city-picker城市选择器，基于jquery-3.3.1
 * 	名为城市选择器，实际不仅仅用于城市选择器，可以作为多级面板，只要传递的json对象符合规范
 * 	主要参数选项
 * 		- 各种样式参数
 * 		- hasDefaultValue=true|false，是否拥有是否默认选项，如果开启则默认选择第一个元素，默认为开启，这与之后json格式有关
 * 		- isMultiSelect=true|false，是否为多选，单选的话，可以根据json对象，级联的创建组件。如果是多选，那就只有一级选项，不会再继续展开
 * 		- hasDefaultSelector=true|false，是否有默认的selector，如果有，第一项的json数据被认为是默认值
 * 	json对象格式说明：
 * 		[单选模式]
 * 		{
 * 			"text": "这里的内容自定义",//整体的名字，selector中值缺省的情况下显示的名称
 * 			"obj": [
 * 				{"text": "默认项"},//如果有默认项，array第一个应为默认项，不会被展开
 * 				{
 * 					"text": "第一项",
 * 					"obj": [
 * 						{"text": "字符串"[, "obj": [...]]},...//省略
 * 					]//如果没有obj，不会再次展开此项
 * 				}
 * 			]
 * 		}
 * 		[多选模式]
 * 		[{
 * 			"text": "这里的内容自定义",//整体的名字，selector中值缺省的情况下显示的名称
 * 			"obj": [
 * 				{"text": "默认项"},//如果有默认项
 * 				{"text": "第一项"},
 * 				{"text": "第二项"},
 * 				...
 * 			]
 * 		}, {...}, ...]
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 	- created by lr
 * 	- 2019-01-30
 * * * * * * * * * * * * * * * * * * * * * * * * * */ 
//引人城市数据
document.write("<script type=\"text/javascript\" src=\"../modules/city-picker/city-picker.citydata.js\" charset=\"UTF-8\"></script>");

//参数配置
CityPicker.pickerWidth = "770px";//picker宽度
CityPicker.pickerMinHeight = "40px";//picker最小高度
CityPicker.panelMinHeight = "60px";//panel最小高度
CityPicker.themeColor = "#01AAED";//picker主色调
CityPicker.backgroundColor = "white";//picker次色调
CityPicker.panelColor = "#f2f2f2";//picker面板背景色调
CityPicker.fontColor = "black";//字体颜色
CityPicker.fontSize = "14px";//字体大小
CityPicker.selectorGap = "10px";//selector之间的间隙
CityPicker.hasDefaultValue = true;//selector是有默认值
CityPicker.isMultiSelect = false;//是否支持多选
CityPicker.hasDefaultSelector = false;//是否有默认的selector

//全局参数配置函数
CityPicker.config = function(data) {
	//遍历所有参数
	for(var conf in data) {//conf为key-value中的key，类型为string
		eval("CityPicker."+conf+"=\""+data[conf]+"\"");//通过eval函数执行js，可实现通过string获得变量名
	}
}

/*
 * 	主类CityPicker
 * 	参数：conf为css样式配置参数，
 */
function CityPicker(parent, conf, data) {
	//conf参数为空,新建
	conf = conf || {};
	
	//局部参数
	var pickerWidth = conf['pickerWidth'] || CityPicker.pickerWidth;
	var pickerMinHeight = conf['pickerMinHeight'] || CityPicker.pickerMinHeight;
	var panelMinHeight = conf['panelMinHeight'] || CityPicker.panelMinHeight;
	var themeColor = conf['themeColor'] || CityPicker.themeColor;
	var backgroundColor = conf['backgroundColor'] || CityPicker.backgroundColor;
	var panelColor = conf['panelColor'] || CityPicker.panelColor;
	var fontColor = conf['fontColor'] || CityPicker.fontColor;
	var fontSize = conf['fontSize'] || CityPicker.fontSize;
	var selectorGap = conf['selectorGap'] || CityPicker.selectorGap;
	//布尔值取参特殊
	var hasDefaultValue = (conf['hasDefaultValue'] != null) ? conf['hasDefaultValue']: CityPicker.hasDefaultValue;
	var isMultiSelect = (conf['isMultiSelect'] != null) ? conf['isMultiSelect']: CityPicker.isMultiSelect;
	var hasDefaultSelector = (conf['hasDefaultSelector'] != null) ? conf['hasDefaultSelector']: CityPicker.hasDefaultSelector;
	
	//城市数据读取
	data = data || CityPicker.citydata;
	
	//私有属性
	var panelFor;//当前panel展开的selector
	var selectedSelector;
	
	//共有属性
	this.dom;//对应dom元素
	
	//私有方法
	//创建picker，根据json对象
	var createPicker = function() {
		//创建div
		var city_picker = document.createElement('div');
		var picker_title = document.createElement('div');
		var picker_panel = document.createElement('div');
		//添加class
		$(city_picker).addClass("city-picker");
		$(picker_title).addClass("picker-title");
		$(picker_panel).addClass("picker-panel");
		//设置css
		$(city_picker).css({"width": pickerWidth, "min-height": pickerMinHeight});
		//字符串转数字，计算，再转换为字符串
		var w = (parseInt(pickerWidth.substr(0, pickerWidth.length-2))-20)+"px";
		var h = (parseInt(pickerMinHeight.substr(0, pickerMinHeight.length-2))-12)+"px";
		$(picker_title).css({"width": w, "height": h});
		
		w = (parseInt(pickerWidth.substr(0, pickerWidth.length-2))-2)+"px";
		h = (parseInt(pickerMinHeight.substr(0, panelMinHeight.length-2))-2)+"px";
		$(picker_panel).css({"width": w, "min-height": h, "background": panelColor, "border": "1px solid "+panelColor});
		
		//设置父子关系
		$(city_picker).append(picker_title);
		$(city_picker).append(picker_panel);
		return city_picker;
	}
	//创建selector
	var createSelector = function(obj, parent) {//obj为json对象
		//创建div
		var selector = document.createElement('div');
		var text = document.createElement('div');
		var flag = document.createElement('div');
		//添加class
		$(selector).addClass("picker-selector");
		$(text).addClass("text");
		$(flag).addClass("icon flag-icon flag");
		//设置属性文本
		if(isMultiSelect) {
			$(text).text(obj['text']);
		} else {
			hasDefaultValue ? $(text).text(obj['obj'][0]['text']): $(text).text(obj['text']);
		}
		selector.obj = obj;
		selector.isOpen = false;//是否展开，默认为false
		//字符串转数字，计算，再转换为字符串
		var h = (parseInt(pickerMinHeight.substr(0, pickerMinHeight.length-2))-12-2)+"px";
		$(selector).css({"margin-right": selectorGap});
		$(text).css({"font-size": fontSize});
		$(flag).css({"color": themeColor});
		if(hasDefaultValue) {
			selector.selectedNumber = isMultiSelect?{"0": true}:0;
			$(selector).css({"color": backgroundColor, "height": h, "line-height": h, "background": themeColor, "border": "1px solid "+themeColor});
			$(flag).css({"color": backgroundColor});
		} else {
			$(selector).css({"color": themeColor, "height": h, "line-height": h, "background": backgroundColor, "border": "1px solid "+themeColor});
		}
		
		//设置父子关系
		$(selector).append(text);
		$(selector).append(flag);
		$(parent).append(selector);
		if(hasDefaultSelector && $(selector).index() == 0) {
			selectedSelector = 0;
			$(flag).removeClass("icon flag-icon");
			$(selector).css({"color": backgroundColor, "background": themeColor, "border": "1px solid "+themeColor});
		}
		return selector;
	}
	
	//创建panel内itmes
	var createItems = function(obj, panel, number) {//obj为json数组
		if(obj == null) return;
		for(var i = 0; i < obj.length; i++) {
			var o = obj[i];
			//创建
			var item = document.createElement('div');
			//添加对象域
			item.obj = o;
			//设置css
			$(item).addClass("picker-item");
			$(item).text(o['text']);
			$(item).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
			//添加
			$(panel).append(item);
		}
		//判断是否有选择状态
		if(number != null) {
			//是否为多选模式，如果多选模式则传递的是一个{"number": true}
			if(typeof(number) == "object") {//如果传递为对象{}则为多选模式
				for(var num in number) {
					if(number[num]) {
						$(panel).children(":eq("+num+")").css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
					}
				}
			} else {//传递的为number
				$(panel).children(":eq("+number+")").css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
			}
		}
	}
	
	//添加事件
	var addEvent = function(picker) {
		//获取各事件组件
		var title = $(picker).children('.picker-title');
		var panel = $(picker).children('.picker-panel');
		var selectors = $(picker).children('.picker-title').children('.picker-selector');
		var items = $(panel).children('.picker-item');//所有item
		
		var selectorClick = function() {
			if(this.isOpen == false) {//此selector无展开
				//设置panelFor
				panelFor = this;
				//移除所有selector的反转效果
				$(selectors).children('.flag').removeClass('rotate');
				$(selectors).each(function(){this.isOpen = false;});
				//移除所有的selector选中状态
				$(selectors).each(function() {
					if(hasDefaultSelector && $(this).index() == 0) return;
					if(this.selectedNumber == null) {
						$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});
						$(this).children('.flag').css("color", themeColor);
					} else {
						if(typeof(this.selectedNumber) == "number") {
							$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
							$(this).children('.flag').css("color", backgroundColor);
						} else {
							var isSelected = false;
							for(var per in this.selectedNumber) {
								if(this.selectedNumber[per]) {
									isSelected = true;
									break;
								}
							}
							if(isSelected) {
								$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
								$(this).children('.flag').css("color", backgroundColor);
							} else {
								$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});
								$(this).children('.flag').css("color", themeColor);
							}
						}
					}
				});
				//为panel重新填装数据
				$(panel).empty();//panel删除旧的数据
				//panel加载新的数据
				createItems(this.obj['obj'], panel, this.selectedNumber);
				//更新items
				items = $(panel).children('.picker-item');
				//添加事件
				$(items).click(isMultiSelect ? itemMultiClick: itemClick);
				
				//标记为已经展开
				this.isOpen = true;
				//改变flag的图标
				$(this).children('.flag').addClass('rotate');
				$(this).children('.flag').css("color", themeColor);
				//改变改变选中状态
				$(this).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
				$(panel).show();
			} else {//已经展开，则关闭此selector
				this.isOpen = false;
				//根据是否选中值，选择selector展示风格
				if(isMultiSelect) {//如果是多选模式
					var hasSelected = false;
					for(var per in this.selectedNumber) {
						if(this.selectedNumber[per]) {
							hasSelected = true;
							break;
						}
					}
					if(hasSelected) {
						$(this).children('.flag').css("color", backgroundColor);//改变flag的图标
						$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});//改变改变选中状态
					} else {
						$(this).children('.flag').css("color", themeColor);//改变flag的图标
						$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});//改变改变选中状态
					}
				} else {//单选模式
					if(this.selectedNumber != null) {
						$(this).children('.flag').css("color", backgroundColor);//改变flag的图标
						$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});//改变改变选中状态
					} else {
						$(this).children('.flag').css("color", themeColor);//改变flag的图标
						$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});//改变改变选中状态
					}
				}
				//移除flag图标的旋转
				$(this).children('.flag').removeClass('rotate');
				$(panel).hide();
			}
		};
		//selector选项事件
		if(isMultiSelect) {
			$(selectors).each(function() {
				if(this.obj['obj'] != null) {
					$(this).click(selectorClick);
				} else {
					$(this).click(function() {
						$(panel).hide();
						//清除其他选择状态
						$(selectors).each(function() {
							if(typeof(this.selectedNumber) == "number") {
								this.selectedNumber = null;
							} else {
								this.selectedNumber = {};
							}
							this.isOpen = false;
							$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});
							$(this).children('.flag').css("color", themeColor);
							$(this).children('.flag').removeClass('rotate');
						});
						selectedSelector = 0;
						$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
					});
				}
			});
		} else {
			$(selectors).click(selectorClick);
		}
		
		var itemClick = function() {
			//清除其他item的选择状态
			$(items).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
			//设置被选中item的状态
			$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
			//更新selector文字
			$(panelFor).children('.text').text($(this).text());
			//设置selector被选中元素的下标
			panelFor.selectedNumber = $(this).prevAll().length;
			if(this['obj']['obj'] != null) {//如果json对象未到底
				//删除此级之后所有selector
				$(panelFor).nextAll().remove();
				//新增下一级selector
				var selector = createSelector(this['obj'], title);
				//更新所有selector
				selectors = $(picker).children('.picker-title').children('.picker-selector');
				//为下一级selector添加事件
				$(selector).click(selectorClick);
				
			} else {//选择到底，不会进行下一级拓展，删除此级之后所有selector
				$(panelFor).nextAll().remove();
				//更新selectors
				selectors = $(picker).children('.picker-title').children('.picker-selector');
			}
		};
		var itemMultiClick = function() {
			if(hasDefaultValue) {//如果有默认值
				//如果是默认item清除所有item的选择状态
				if(items[0] == this) {
					//清除所有item的选择状态
					for(var per in panelFor.selectedNumber){panelFor.selectedNumber[per] = false};
					$(items).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
					//设置被选中item的状态
					panelFor.selectedNumber[''+$(this).index()+''] = true;
					$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
				} else {//如果选中的不是默认按钮
					//如果选中的不是默认按钮，则可以取消默认按钮的选中（互斥）
					panelFor.selectedNumber['0'] = false;
					$(items[0]).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
					var index = ''+$(this).index()+'';//被选中的所在兄弟节点集合的index
					//设置被选中item的状态，如果已选中，再次按则取消选中
					if(panelFor.selectedNumber[index] == true) {
						//设置取消选中
						panelFor.selectedNumber[index] = false;
						$(this).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
						//如果所有都元素取消选择，则默认选第一个选中
						var unselect = true;
						for(var per in panelFor.selectedNumber) {
							if(panelFor.selectedNumber[per]) {
								unselect = false;
								break;
							}
						}
						if(unselect) {
							panelFor.selectedNumber['0'] = true;
							$(items[0]).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
						}
					} else {
						//设置选中状态
						panelFor.selectedNumber[index] = true;
						$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
					}
				}	
			} else {//无默认值
				var index = ''+$(this).index()+'';//被选中的所在兄弟节点集合的index
				panelFor.selectedNumber = panelFor.selectedNumber || {};//如果selected为空则新建
				//设置被选中item的状态，如果已选中，再次按则取消选中
				if(panelFor.selectedNumber[index] == true) {
					//设置取消选中
					panelFor.selectedNumber[index] = false;
					$(this).css({"background": panelColor, "border": "1px solid "+panelColor, "color": themeColor});
					//如果无选中则跳回默认值
					if(hasDefaultSelector) {//有默认selector的情况下
						var unselect = true;
						for(var per in panelFor.selectedNumber) {
							if(panelFor.selectedNumber[per]) {
								unselect = false;
								break;
							}
						}
						if(unselect) {
							selectedSelector = 0;
							$(selectors[0]).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
							return;
						}
					}
				} else {
					//设置选中状态
					panelFor.selectedNumber[index] = true;
					$(this).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
				}
			}
			//清除其他选择状态
			$(selectors).each(function() {
				if(this == panelFor) return;
				if(typeof(this.selectedNumber) == "number") {
					this.selectedNumber = null;
				} else {
					this.selectedNumber = {};
				}
				$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});
				$(this).children('.flag').css("color", themeColor);
			});
			selectedSelector = $(panelFor).index();
//			$(panelFor).css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
//			$(panelFor).children('.flag').css("color", backgroundColor);
		};
		//items点击事件
		$(items).click(isMultiSelect ? itemMultiClick: itemClick);
	}
	
	//代码，初始化
	if(data == null) return;//json数据不能为空
	this.dom = createPicker();
	if(isMultiSelect) {
		//alert(JSON.stringify(data));
		for(var i = 0; i < data.length; i++) {
			//创建selector
			createSelector(data[i], $(this.dom).children('.picker-title'));
			//创建所有item
			createItems(data[i]['obj'], $(this.dom).children('.picker-panel'), (hasDefaultValue?0:null));
		}
	} else {
		//创建selector
		createSelector(data, $(this.dom).children('.picker-title'));
		//创建所有item
		createItems(data['obj'], $(this.dom).children('.picker-panel'), (hasDefaultValue?0:null));
	}
	//添加事件
	addEvent(this.dom);
	//多选模式下默认选中第一个selector
	if(isMultiSelect && hasDefaultSelector) {
		//清除其他选择状态
		$(this.dom).children('.picker-title').children().each(function() {
			this.selectedNumber = {};
			$(this).css({"background": backgroundColor, "border": "1px solid "+themeColor, "color": themeColor});
			$(this).children('.flag').css("color", themeColor);
			$(this).children('.flag').removeClass('rotate');
		});
		selectedSelector = 0;
		$(this.dom).children('.picker-title').children(':first').css({"background": themeColor, "border": "1px solid "+themeColor, "color": backgroundColor});
	}
	//加入到指定父容器
	$(parent).append(this.dom);
	return this;
}
