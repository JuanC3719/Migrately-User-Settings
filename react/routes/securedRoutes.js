const UserSettingsChange = lazy(() => import("../components/user/UserSettingsChangeForm"));
const ChangePassword = lazy(() => import("../components/user/ChangePassword"));

const usersRoutes = [
  {
    path: "/users/:id/settings",
    name: "UserSettingsChange",
    exact: true,
    element: UserSettingsChange,
    roles: [],
    isAnonymous: true,
  },
  {
    path: "/forgotpassword",
    name: "ForgotPassword",
    exact: true,
    element: ChangePassword,
    roles: [],
    isAnonymous: true,
  },
];

export default usersRoutes;
