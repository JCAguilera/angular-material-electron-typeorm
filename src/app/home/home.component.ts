import { Post } from "@entity";
import { ElectronService } from "./../core/services/electron/electron.service";
import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];

  newPost = {
    title: "",
    text: "",
  };

  constructor(
    private electron: ElectronService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // TODO: Transform into Observer and subscribe
    this.getPosts();
  }

  addPost(): void {
    this.electron.ipcRenderer
      .invoke("posts:create", this.newPost)
      .then((success: boolean) => {
        this.snackBar.open(
          success ? "Post added." : "Error adding post.",
          "Ok"
        );
        this.getPosts();
      });
  }

  removePost(post: Post): void {
    this.electron.ipcRenderer
      .invoke("posts:remove", post)
      .then((success: boolean) => {
        this.snackBar.open(
          success ? "Post removed." : "Error removing post.",
          "Ok"
        );
        this.getPosts();
      });
  }

  getPosts(): void {
    this.electron.ipcRenderer.invoke("posts:get").then((posts: Post[]) => {
      this.posts = posts;
    });
  }
}
