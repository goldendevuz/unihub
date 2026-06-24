import User from "../models/user.model.js";

export const getUserProfileAndRepos = async (req, res) => {
	const { username } = req.params;

	try {
		const headers = {
			authorization: `token ${process.env.GITHUB_API_KEY}`,
		};

		const userRes = await fetch(
			`https://api.github.com/users/${username}`,
			{ headers }
		);

		const userProfile = await userRes.json();

		if (!userRes.ok) {
			return res.status(userRes.status).json({
				error: userProfile.message || "Failed to fetch user profile",
			});
		}

		if (!userProfile.repos_url) {
			return res.status(404).json({
				error: "Repository URL not found",
			});
		}

		const repoRes = await fetch(userProfile.repos_url, {
			headers,
		});

		const repos = await repoRes.json();

		if (!repoRes.ok) {
			return res.status(repoRes.status).json({
				error: repos.message || "Failed to fetch repositories",
			});
		}

		res.status(200).json({
			userProfile,
			repos,
		});
	} catch (error) {
		console.error("getUserProfileAndRepos:", error);

		res.status(500).json({
			error: error.message,
		});
	}
};

export const likeProfile = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findById(req.user._id.toString());

		if (!user) {
			return res.status(404).json({
				error: "Authenticated user not found",
			});
		}

		const userToLike = await User.findOne({ username });

		if (!userToLike) {
			return res.status(404).json({
				error: "User is not a member",
			});
		}

		if (user.likedProfiles.includes(userToLike.username)) {
			return res.status(400).json({
				error: "User already liked",
			});
		}

		userToLike.likedBy.push({
			username: user.username,
			avatarUrl: user.avatarUrl,
			likedDate: Date.now(),
		});

		user.likedProfiles.push(userToLike.username);

		await Promise.all([
			userToLike.save(),
			user.save(),
		]);

		res.status(200).json({
			message: "User liked",
		});
	} catch (error) {
		console.error("likeProfile:", error);

		res.status(500).json({
			error: error.message,
		});
	}
};

export const getLikes = async (req, res) => {
	try {
		const user = await User.findById(req.user._id.toString());

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		res.status(200).json({
			likedBy: user.likedBy,
		});
	} catch (error) {
		console.error("getLikes:", error);

		res.status(500).json({
			error: error.message,
		});
	}
};
