terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

resource "aws_key_pair" "runner_key" {
  key_name   = "gitlab-runner-key"
  public_key = file(pathexpand("~/.ssh/gitlab_runner_aws.pub"))
}

resource "aws_security_group" "runner_sg" {
  name        = "runner-security-group"
  description = "Allow SSH inbound and all outbound traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "gitlab_runner" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = aws_key_pair.runner_key.key_name
  
  vpc_security_group_ids = [aws_security_group.runner_sg.id]

  root_block_device {
    volume_size = 25
    volume_type = "gp3"
  }

  tags = {
    Name = "GitLab-Runner-Server"
  }
}

output "server_ip" {
  value = aws_instance.gitlab_runner.public_ip
}
