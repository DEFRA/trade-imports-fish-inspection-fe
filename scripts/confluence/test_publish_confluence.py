import argparse
import unittest
from unittest.mock import patch

from publish_confluence import (
    ZERO_SHA,
    main,
    parse_after_revision,
    parse_before_revision,
)


class GitRevisionArgumentTests(unittest.TestCase):
    def test_before_accepts_sha_and_parent_revision(self):
        sha = "a" * 40

        self.assertEqual(parse_before_revision(sha), sha)
        self.assertEqual(parse_before_revision(f"{sha}^"), f"{sha}^")
        self.assertEqual(parse_before_revision(ZERO_SHA), ZERO_SHA)

    def test_after_accepts_sha_and_head(self):
        sha = "a" * 40

        self.assertEqual(parse_after_revision(sha), sha)
        self.assertEqual(parse_after_revision("HEAD"), "HEAD")

    def test_rejects_option_like_revision_before_running_git(self):
        with patch("publish_confluence.git") as git:
            with self.assertRaises(SystemExit) as error:
                main(["--before=--upload-pack=command", "--dry-run"])

        self.assertEqual(error.exception.code, 2)
        git.assert_not_called()

    def test_rejects_non_commit_revision(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            parse_after_revision("HEAD~1")


if __name__ == "__main__":
    unittest.main()
