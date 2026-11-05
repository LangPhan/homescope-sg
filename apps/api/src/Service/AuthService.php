<?php
declare(strict_types=1);
namespace HomeScope\Service;
use Firebase\JWT\JWT;
use PDO;

final class AuthService
{
    public function __construct(private PDO $db) {}
    public function register(string $name,string $email,string $password): array
    {
        if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<8)throw new \InvalidArgumentException('Enter a valid email and a password with at least 8 characters.');
        try{$stmt=$this->db->prepare('INSERT INTO users(name,email,password_hash) VALUES(:name,:email,:hash)');$stmt->execute(['name'=>trim($name),'email'=>strtolower($email),'hash'=>password_hash($password,PASSWORD_ARGON2ID)]);}catch(\PDOException $e){if($e->getCode()==='23000')throw new \DomainException('An account with this email already exists.');throw $e;}
        return $this->issue((int)$this->db->lastInsertId(),$email);
    }
    public function login(string $email,string $password): array
    {
        $stmt=$this->db->prepare('SELECT id,email,password_hash FROM users WHERE email=:email');$stmt->execute(['email'=>strtolower($email)]);$user=$stmt->fetch();if(!$user||!password_verify($password,$user['password_hash']))throw new \DomainException('Email or password is incorrect.');return $this->issue((int)$user['id'],$user['email']);
    }
    private function issue(int $userId,string $email): array
    {
        $now=time();$secret=getenv('JWT_SECRET')?:'local-development-secret-change-me';$access=JWT::encode(['iss'=>'homescope','sub'=>(string)$userId,'email'=>$email,'iat'=>$now,'exp'=>$now+900],$secret,'HS256');$plain=bin2hex(random_bytes(32));$stmt=$this->db->prepare('INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES(:user_id,:hash,DATE_ADD(NOW(),INTERVAL 7 DAY))');$stmt->execute(['user_id'=>$userId,'hash'=>hash('sha256',$plain)]);return ['access_token'=>$access,'expires_in'=>900,'refresh_token'=>$plain];
    }
    public function refresh(string $plain): array
    {
        $this->db->beginTransaction();try{$stmt=$this->db->prepare('SELECT rt.id,rt.user_id,u.email FROM refresh_tokens rt JOIN users u ON u.id=rt.user_id WHERE rt.token_hash=:hash AND rt.revoked_at IS NULL AND rt.expires_at>NOW() FOR UPDATE');$stmt->execute(['hash'=>hash('sha256',$plain)]);$token=$stmt->fetch();if(!$token)throw new \DomainException('Refresh session is invalid or expired.');$this->db->prepare('UPDATE refresh_tokens SET revoked_at=NOW() WHERE id=:id')->execute(['id'=>$token['id']]);$pair=$this->issue((int)$token['user_id'],$token['email']);$this->db->commit();return $pair;}catch(\Throwable $e){$this->db->rollBack();throw $e;}
    }
    public function logout(string $plain): void {$this->db->prepare('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=:hash')->execute(['hash'=>hash('sha256',$plain)]);}
}
