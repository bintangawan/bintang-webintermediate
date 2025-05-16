import HomePage from '../pages/home/home-page';
import AddStoryPage from '../pages/add-story/add-page';
import StoriesPage from '../pages/stories/stories-page';
import LoginPage from '../pages/auth/login/login-page';
import RegisterPage from '../pages/auth/register/register-page';
import BookmarkPage from '../pages/bookmark/bookmark-page';
import NotFoundPage from '../pages/not-found/not-found-page';

const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/add': AddStoryPage,
  '/stories/:id': StoriesPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/bookmark': BookmarkPage,
  '/not-found': NotFoundPage,
};

export default routes;
