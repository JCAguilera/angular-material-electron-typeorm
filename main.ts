import { stringToKeyValue } from "@angular/flex-layout/extended/typings/style/style-transforms";
import { app, BrowserWindow, ipcMain, screen } from "electron";
import * as path from "path";
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getRepository,
} from "typeorm";
import * as url from "url";
import { Post } from "./entity";

const options: ConnectionOptions = {
  type: "sqlite",
  synchronize: true,
  logging: true,
  logger: "simple-console",
  database: "database.db",
  entities: [Post],
};

let connection: Connection = null;
let win: BrowserWindow = null;

const args = process.argv.slice(1),
  serve = args.some((val) => val === "--serve");

async function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      enableRemoteModule: true, // true if you want to run 2e2 test or use remote module in renderer context (ie. Angular)
    },
  });

  if (serve) {
    win.webContents.openDevTools();

    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL("http://localhost:4200");
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "dist/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  connection = await createConnection(options);

  /*const repo = connection.getRepository(Post);
    const post = new Post();
    post.id = 1;
    post.text = "Hola";
    post.title = "Titulazo";
    await repo.save(post);
    const posts = await repo.find();
    console.log("posts:", posts);*/

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on("ready", () =>
    setTimeout(() => {
      createWindow();
    }, 400)
  );

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  // ENDPOINTS

  ipcMain.handle("posts:get", async () => {
    return await getRepository(Post).find();
  });
  // Here post is not a Post object it's just the title and the text
  ipcMain.handle("posts:create", async (event, post) => {
    return !!(await getRepository(Post).save(post));
  });
  ipcMain.handle("posts:remove", async (event, post: Post) => {
    return !!(await getRepository(Post).remove(post));
  });
} catch (e) {
  // Catch Error
  // throw e;
}
