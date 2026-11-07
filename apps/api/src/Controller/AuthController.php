<?php
declare(strict_types=1);
namespace HomeScope\Controller;
use HomeScope\Http;
use HomeScope\Metrics;
use HomeScope\Service\AuthService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
final class AuthController
{
    public function __construct(private AuthService $auth, private Metrics $metrics){}
    /** @return array<string,mixed> */
    private function body(ServerRequestInterface $r):array{return (array)json_decode((string)$r->getBody(),true);}
    private function cookie(string $token):string{$secure=filter_var(getenv('COOKIE_SECURE')?:'false',FILTER_VALIDATE_BOOL)?'; Secure':'';return "refresh_token={$token}; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=604800{$secure}";}
    public function register(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{try{$b=$this->body($r);$pair=$this->auth->register($b['name']??'Explorer',$b['email']??'',$b['password']??'');$refresh=$pair['refresh_token'];unset($pair['refresh_token']);$this->metrics->increment('auth_total',['flow','outcome'],['register','success']);return Http::json($res,['data'=>$pair],201)->withHeader('Set-Cookie',$this->cookie($refresh));}catch(\InvalidArgumentException|\DomainException $e){$this->metrics->increment('auth_total',['flow','outcome'],['register','failure']);return Http::error($res,'VALIDATION_ERROR',$e->getMessage(),422);}}
    public function login(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{try{$b=$this->body($r);$pair=$this->auth->login($b['email']??'',$b['password']??'');$refresh=$pair['refresh_token'];unset($pair['refresh_token']);$this->metrics->increment('auth_total',['flow','outcome'],['login','success']);return Http::json($res,['data'=>$pair])->withHeader('Set-Cookie',$this->cookie($refresh));}catch(\DomainException $e){$this->metrics->increment('auth_total',['flow','outcome'],['login','failure']);return Http::error($res,'INVALID_CREDENTIALS',$e->getMessage(),401);}}
    public function refresh(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{try{$token=$r->getCookieParams()['refresh_token']??'';$pair=$this->auth->refresh($token);$refresh=$pair['refresh_token'];unset($pair['refresh_token']);$this->metrics->increment('auth_total',['flow','outcome'],['refresh','success']);return Http::json($res,['data'=>$pair])->withHeader('Set-Cookie',$this->cookie($refresh));}catch(\DomainException $e){$this->metrics->increment('auth_total',['flow','outcome'],['refresh','failure']);return Http::error($res,'INVALID_REFRESH',$e->getMessage(),401);}}
    public function logout(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{$this->auth->logout($r->getCookieParams()['refresh_token']??'');return $res->withStatus(204)->withHeader('Set-Cookie','refresh_token=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0');}
}
