import passport from "passport";
import dotenv from "dotenv";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";

dotenv.config();

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: process.env.GITHUB_CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				console.log("GitHub login:", profile.username);

				let user = await User.findOne({
					username: profile.username,
				});

				if (!user) {
					user = new User({
						name: profile.displayName,
						username: profile.username,
						profileUrl: profile.profileUrl,
						avatarUrl: profile.photos?.[0]?.value,
						likedProfiles: [],
						likedBy: [],
					});

					await user.save();

					console.log("New user created:", profile.username);
				}

				return done(null, user);
			} catch (error) {
				console.error("GitHub auth error:", error);
				return done(error, null);
			}
		}
	)
);
