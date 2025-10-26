# QRFPS-自创游戏

基于Three.js的自创FPS游戏，使用ammo.js物理引擎和three-pathfinding路径寻找，采用ES6和Webpack构建。

该项目具有实体/组件系统，使用ammo.js刚体的FPS控制器，具有根运动动画的NPC和基本AI。

请注意，该项目仍在开发中。

[在线演示](http://venolabs.com/three-fps-demo/)

## 安装
在开始之前，请确保您熟悉终端命令并已安装[Node和NPM](https://www.npmjs.com/get-npm)。然后通过下载或Git进行安装。

### 通过下载安装
首先下载[项目的zip文件](https://github.com/mohsenheydari/three-fps/archive/master.zip)并解压。然后在终端中进入该文件夹，输入`npm install`进行设置。要开始运行，请执行：`npm start`。

### 使用Git安装
在终端中将项目克隆到您选择的目录中，然后删除git文件夹以重新开始。

```bash
git clone --depth=1 https://github.com/mohsenheydari/three-fps.git three-fps
cd three-fps
rm -rf .git
npm install
```

## 运行开发服务器
要查看您对项目所做的更改，请转到终端中的项目文件夹并输入...

```bash
npm start
```

此命令将打包项目代码并在[http://localhost:8080/](http://localhost:8080/)启动开发服务器。在您的网络浏览器中访问此地址。

## 编辑代码
您应该打开的第一个文件是`./src/entry.js`。在其中，您将找到主要的应用程序类。该类负责初始化库和加载艺术资产，还处理主要的游戏循环。

## 为网络构建项目
在终端中运行`npm run build`将把您的项目打包到`./build/`文件夹中。您可以将此目录上传到网络服务器。有关更复杂的结果，请阅读[此指南](https://webpack.js.org/guides/production/)。

## 关于模型
此项目中使用的艺术资产：

* [Ak47](https://skfb.ly/6UEL9) by [kursat_sokmen](https://sketchfab.com/kursat_sokmen) is licensed under CC BY 4.0
* [Metal Ammo Box](https://skfb.ly/6UAQY) by [TheoClarke](https://sketchfab.com/TheoClarke) is licensed under CC BY 4.0
* [Mutant](https://mixamo.com) by [mixamo.com](https://mixamo.com)
* [Veld Fire](https://hdrihaven.com/hdri/?h=veld_fire) by [Greg Zaal](https://hdrihaven.com/hdris/?a=Greg%20Zaal) is licensed under CC0

## 感谢
* [Three Seed](https://github.com/edwinwebb/three-seed)
* [ammo.js](https://github.com/kripken/ammo.js/)
* [three-pathfinding](https://github.com/donmccurdy/three-pathfinding)

## 许可证
[MIT](https://github.com/mohsenheydari/three-fps/blob/master/LICENSE)
