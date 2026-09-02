// Mirrors the JSON shapes returned by node-express-sequelize-realworld-example-app.
// Keeping these typed means a wrong field name is a compile error, not a runtime surprise.

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponse {
  user: User;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface ArticleResponse {
  article: Article;
}

export interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export interface Comment {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Profile;
}

export interface CommentResponse {
  comment: Comment;
}

export interface CommentsResponse {
  comments: Comment[];
}

/** Shape of a failed auth response, e.g. {"errors":{"email or password":"is invalid"}}. */
export interface ErrorsResponse {
  errors: Record<string, string>;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

/** PUT /user only changes fields you send - see routes/api/users.js's `typeof !== 'undefined'`
 *  checks, which is why every field here is optional even though NewUser's aren't. */
export interface UpdateUserFields {
  username?: string;
  email?: string;
  password?: string;
  bio?: string;
  image?: string;
}

export interface TagsResponse {
  tags: string[];
}
